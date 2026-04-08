const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM message_templates ORDER BY updated_at DESC');
    
    // Get media for each template
    for (const template of rows) {
      const [media] = await db.execute(
        'SELECT * FROM template_media WHERE template_id = ?',
        [template.id]
      );
      template.media = media;
    }

    res.json({ templates: rows });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Save template
router.post('/', async (req, res) => {
  try {
    const { name, messageText, campaignId } = req.body;
    const db = getPool();
    const id = uuidv4();

    await db.execute(
      'INSERT INTO message_templates (id, name, message_text) VALUES (?, ?, ?)',
      [id, name, messageText]
    );

    // If campaignId provided, copy media from campaign to template
    if (campaignId) {
      const [media] = await db.execute(
        'SELECT * FROM campaign_media WHERE campaign_id = ?',
        [campaignId]
      );
      
      for (const m of media) {
        await db.execute(
          `INSERT INTO template_media (id, template_id, media_type, file_name, cloudinary_url, cloudinary_public_id, file_size)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), id, m.media_type, m.file_name, m.cloudinary_url, m.cloudinary_public_id, m.file_size]
        );
      }
    }

    res.json({ success: true, template: { id, name, messageText } });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Load template into campaign
router.post('/:id/load', async (req, res) => {
  try {
    const { campaignId } = req.body;
    const db = getPool();

    const [templates] = await db.execute('SELECT * FROM message_templates WHERE id = ?', [req.params.id]);
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];

    // Update campaign message
    await db.execute(
      'UPDATE campaigns SET message_text = ? WHERE id = ?',
      [template.message_text, campaignId]
    );

    // Copy template media to campaign
    const [templateMedia] = await db.execute(
      'SELECT * FROM template_media WHERE template_id = ?',
      [req.params.id]
    );

    // Clear existing campaign media
    await db.execute('DELETE FROM campaign_media WHERE campaign_id = ?', [campaignId]);

    for (const m of templateMedia) {
      await db.execute(
        `INSERT INTO campaign_media (id, campaign_id, media_type, file_name, cloudinary_url, cloudinary_public_id, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), campaignId, m.media_type, m.file_name, m.cloudinary_url, m.cloudinary_public_id, m.file_size]
      );
    }

    res.json({
      success: true,
      messageText: template.message_text,
      mediaCount: templateMedia.length,
    });
  } catch (error) {
    console.error('Load template error:', error);
    res.status(500).json({ error: 'Failed to load template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM template_media WHERE template_id = ?', [req.params.id]);
    await db.execute('DELETE FROM message_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
