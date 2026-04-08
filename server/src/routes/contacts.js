const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { upload } = require('../middleware/upload');
const { getPool } = require('../config/database');

// Upload CSV/Excel contacts
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let contacts = [];

    if (ext === '.csv') {
      contacts = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      contacts = parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type. Use CSV or Excel.' });
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No valid contacts found in file' });
    }

    res.json({
      success: true,
      totalContacts: contacts.length,
      contacts: contacts,
      preview: contacts.slice(0, 10),
    });
  } catch (error) {
    console.error('Contact upload error:', error);
    res.status(500).json({ error: 'Failed to process contacts file' });
  }
});

// Save contacts to a campaign
router.post('/save', async (req, res) => {
  try {
    const { campaignId, contacts } = req.body;
    
    if (!campaignId || !contacts || !contacts.length) {
      return res.status(400).json({ error: 'Campaign ID and contacts are required' });
    }

    const db = getPool();
    
    // Delete existing contacts for this campaign
    await db.execute('DELETE FROM contacts WHERE campaign_id = ?', [campaignId]);

    // Insert new contacts
    const values = contacts.map(c => [
      uuidv4(),
      campaignId,
      c.name || null,
      sanitizePhone(c.phone),
      c.email || null,
      'pending',
    ]);

    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const flat = values.flat();
      await db.execute(
        `INSERT INTO contacts (id, campaign_id, name, phone, email, status) VALUES ${placeholders}`,
        flat
      );
    }

    // Update campaign total
    await db.execute(
      'UPDATE campaigns SET total_contacts = ? WHERE id = ?',
      [values.length, campaignId]
    );

    res.json({ success: true, saved: values.length });
  } catch (error) {
    console.error('Save contacts error:', error);
    res.status(500).json({ error: 'Failed to save contacts' });
  }
});

// Get contacts for a campaign
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM contacts WHERE campaign_id = ? ORDER BY created_at',
      [req.params.campaignId]
    );
    res.json({ contacts: rows });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

function sanitizePhone(phone) {
  if (!phone) return '';
  // Strip all non-digits (and leading +)
  let cleaned = String(phone).trim();
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }
  // Prepend India country code 91 if not already present
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const contacts = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const phone = findPhoneField(row);
        if (phone) {
          contacts.push({
            name: row.name || row.Name || row.NAME || row['Full Name'] || '',
            phone: phone,
            email: row.email || row.Email || row.EMAIL || '',
          });
        }
      })
      .on('end', () => resolve(contacts))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  return data
    .map(row => {
      const phone = findPhoneField(row);
      if (!phone) return null;
      return {
        name: row.name || row.Name || row.NAME || row['Full Name'] || '',
        phone: phone,
        email: row.email || row.Email || row.EMAIL || '',
      };
    })
    .filter(Boolean);
}

function findPhoneField(row) {
  const phoneKeys = ['phone', 'Phone', 'PHONE', 'mobile', 'Mobile', 'MOBILE', 
                     'phone_number', 'Phone Number', 'phone number', 'contact',
                     'Contact', 'CONTACT', 'whatsapp', 'WhatsApp', 'number', 'Number'];
  
  for (const key of phoneKeys) {
    if (row[key]) return String(row[key]);
  }
  
  // Try to find any field that looks like a phone number
  for (const [key, value] of Object.entries(row)) {
    const str = String(value).replace(/\D/g, '');
    if (str.length >= 10 && str.length <= 15) {
      return String(value);
    }
  }
  
  return null;
}

module.exports = router;
