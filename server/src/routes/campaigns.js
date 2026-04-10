const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');
const { sendCampaignMessage, isOnWhatsApp } = require('../config/whatsapp');

// Active sending processes
const activeSenders = new Map();

// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const { name, messageText } = req.body;
    const db = getPool();
    const id = uuidv4();

    await db.execute(
      'INSERT INTO campaigns (id, name, message_text) VALUES (?, ?, ?)',
      [id, name || `Campaign ${new Date().toLocaleDateString()}`, messageText || '']
    );

    res.json({ success: true, campaign: { id, name, messageText } });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM campaigns ORDER BY created_at DESC'
    );
    res.json({ campaigns: rows });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

// Get single campaign with media and contacts
router.get('/:id', async (req, res) => {
  try {
    const db = getPool();
    const [campaigns] = await db.execute('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const [media] = await db.execute(
      'SELECT * FROM campaign_media WHERE campaign_id = ?',
      [req.params.id]
    );
    const [contacts] = await db.execute(
      'SELECT * FROM contacts WHERE campaign_id = ? ORDER BY created_at',
      [req.params.id]
    );

    res.json({
      campaign: campaigns[0],
      media,
      contacts,
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to get campaign' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { name, messageText, batchSize, batchDelaySeconds, status } = req.body;
    const db = getPool();

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (messageText !== undefined) { updates.push('message_text = ?'); params.push(messageText); }
    if (batchSize !== undefined) { updates.push('batch_size = ?'); params.push(batchSize); }
    if (batchDelaySeconds !== undefined) { updates.push('batch_delay_seconds = ?'); params.push(batchDelaySeconds); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    await db.execute(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Start sending campaign
router.post('/:id/send', async (req, res) => {
  try {
    const db = getPool();
    const [campaigns] = await db.execute('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaigns[0];
    
    if (campaign.status === 'sending') {
      return res.status(400).json({ error: 'Campaign is already sending' });
    }

    // Get media and pending contacts
    const [media] = await db.execute(
      'SELECT * FROM campaign_media WHERE campaign_id = ?',
      [campaign.id]
    );
    const [contacts] = await db.execute(
      'SELECT * FROM contacts WHERE campaign_id = ? AND status = ?',
      [campaign.id, 'pending']
    );

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No pending contacts to send to' });
    }

    // Update campaign status
    await db.execute(
      'UPDATE campaigns SET status = ?, sent_count = 0, failed_count = 0 WHERE id = ?',
      ['sending', campaign.id]
    );

    // Create report
    const reportId = uuidv4();
    await db.execute(
      'INSERT INTO reports (id, campaign_id, total_contacts, start_time) VALUES (?, ?, ?, NOW())',
      [reportId, campaign.id, contacts.length]
    );

    // Start batch sending in background
    startBatchSending(campaign, contacts, media, reportId);

    res.json({
      success: true,
      message: 'Campaign sending started',
      totalContacts: contacts.length,
      batchSize: campaign.batch_size,
      batchDelay: campaign.batch_delay_seconds,
      reportId,
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

// Get campaign sending status
router.get('/:id/status', async (req, res) => {
  try {
    const db = getPool();
    const [campaigns] = await db.execute(
      'SELECT id, status, total_contacts, sent_count, failed_count FROM campaigns WHERE id = ?',
      [req.params.id]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const isActive = activeSenders.has(req.params.id);
    res.json({ ...campaigns[0], isActive });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Pause campaign
router.post('/:id/pause', async (req, res) => {
  try {
    const sender = activeSenders.get(req.params.id);
    if (sender) {
      sender.paused = true;
    }

    const db = getPool();
    await db.execute('UPDATE campaigns SET status = ? WHERE id = ?', ['paused', req.params.id]);

    res.json({ success: true, message: 'Campaign paused' });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// Bulk delete campaigns
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const db = getPool();
    for (const id of ids) {
      const sender = activeSenders.get(id);
      if (sender) { sender.stopped = true; activeSenders.delete(id); }
      await db.execute('DELETE FROM contacts WHERE campaign_id = ?', [id]);
      await db.execute('DELETE FROM campaign_media WHERE campaign_id = ?', [id]);
      await db.execute('DELETE FROM reports WHERE campaign_id = ?', [id]);
      await db.execute('DELETE FROM campaigns WHERE id = ?', [id]);
    }
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete campaigns' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const db = getPool();
    
    // Stop sending if active
    const sender = activeSenders.get(req.params.id);
    if (sender) {
      sender.stopped = true;
      activeSenders.delete(req.params.id);
    }

    await db.execute('DELETE FROM contacts WHERE campaign_id = ?', [req.params.id]);
    await db.execute('DELETE FROM campaign_media WHERE campaign_id = ?', [req.params.id]);
    await db.execute('DELETE FROM reports WHERE campaign_id = ?', [req.params.id]);
    await db.execute('DELETE FROM campaigns WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Background batch sending function
async function startBatchSending(campaign, contacts, media, reportId) {
  const db = getPool();
  const isSingle = contacts.length === 1;
  const batchSize = isSingle ? 1 : (campaign.batch_size || 10);
  const delayMs = isSingle ? 0 : (campaign.batch_delay_seconds || 60) * 1000;
  
  const sender = { paused: false, stopped: false };
  activeSenders.set(campaign.id, sender);

  let sentCount = 0;
  let failedCount = 0;
  let contactIndex = 0; // global index across all batches for round-robin instance selection

  try {
    for (let i = 0; i < contacts.length; i += batchSize) {
      if (sender.stopped) break;
      
      // Wait between batches (skip first batch and skip for single contact)
      if (i > 0 && !isSingle) {
        await wait(delayMs);
        if (sender.stopped) break;
      }

      // Handle pause
      while (sender.paused && !sender.stopped) {
        await wait(1000);
      }
      if (sender.stopped) break;

      const batch = contacts.slice(i, i + batchSize);

      for (const contact of batch) {
        if (sender.stopped) break;
        while (sender.paused && !sender.stopped) {
          await wait(1000);
        }
        if (sender.stopped) break;

        try {
          // Validate the number is on WhatsApp before sending
          const onWhatsApp = await isOnWhatsApp(contact.phone, contactIndex);
          if (!onWhatsApp) {
            failedCount++;
            console.error(`[INVALID] +${contact.phone} (${contact.name || 'unknown'}) — not a WhatsApp number`);
            await db.execute(
              'UPDATE contacts SET status = ?, error_message = ? WHERE id = ?',
              ['failed', 'Not a valid WhatsApp number', contact.id]
            );
            await db.execute(
              'UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?',
              [sentCount, failedCount, campaign.id]
            );
            contactIndex++;
            if (!isSingle) await wait(2000);
            continue;
          }

          const personalised = campaign.message_text
            ? campaign.message_text.replace(/\{\{name\}\}/gi, contact.name || 'Student')
            : campaign.message_text;
          const results = await sendCampaignMessage(contact.phone, personalised, media, contactIndex);
          sentCount++;
          const warnings = results._warnings;
          if (warnings && warnings.length) {
            console.warn(`[PARTIAL] +${contact.phone} (${contact.name || 'unknown'}) — text sent but: ${warnings.join('; ')}`);
          } else {
            console.log(`[SENT] +${contact.phone} (${contact.name || 'unknown'})`);
          }
          await db.execute(
            'UPDATE contacts SET status = ?, sent_at = NOW(), error_message = ? WHERE id = ?',
            ['sent', warnings ? warnings.join('; ') : null, contact.id]
          );
        } catch (err) {
          failedCount++;
          const raw = err.response?.data;
          const reason = raw
            ? (typeof raw.message === 'string' ? raw.message : JSON.stringify(raw))
            : (err.message || 'Unknown error');
          console.error(`[FAILED] +${contact.phone} (${contact.name || 'unknown'}) — ${reason}`);
          await db.execute(
            'UPDATE contacts SET status = ?, error_message = ? WHERE id = ?',
            ['failed', reason.substring(0, 500), contact.id]
          );
        }

        // Update campaign counts
        await db.execute(
          'UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?',
          [sentCount, failedCount, campaign.id]
        );

        contactIndex++; // advance round-robin index regardless of success/failure

        // Small delay between individual messages (skip for single contact)
        if (!isSingle) await wait(2000);
      }
    }

    // Finalize
    const finalStatus = sender.stopped ? 'paused' : 'completed';
    await db.execute(
      'UPDATE campaigns SET status = ?, sent_count = ?, failed_count = ? WHERE id = ?',
      [finalStatus, sentCount, failedCount, campaign.id]
    );

    await db.execute(
      'UPDATE reports SET sent_count = ?, failed_count = ?, skipped_count = ?, end_time = NOW() WHERE id = ?',
      [sentCount, failedCount, contacts.length - sentCount - failedCount, reportId]
    );
  } catch (error) {
    console.error('Batch sending error:', error);
    await db.execute(
      'UPDATE campaigns SET status = ? WHERE id = ?',
      ['failed', campaign.id]
    );
  } finally {
    activeSenders.delete(campaign.id);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;
