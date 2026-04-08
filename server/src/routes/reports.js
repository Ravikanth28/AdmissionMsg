const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// Get all reports
router.get('/', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(`
      SELECT r.*, c.name as campaign_name, c.message_text
      FROM reports r
      JOIN campaigns c ON r.campaign_id = c.id
      ORDER BY r.created_at DESC
    `);
    res.json({ reports: rows });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Get single report with contact details
router.get('/:id', async (req, res) => {
  try {
    const db = getPool();
    const [reports] = await db.execute(`
      SELECT r.*, c.name as campaign_name, c.message_text
      FROM reports r
      JOIN campaigns c ON r.campaign_id = c.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const [contacts] = await db.execute(
      'SELECT * FROM contacts WHERE campaign_id = ? ORDER BY status, name',
      [reports[0].campaign_id]
    );

    res.json({
      report: reports[0],
      contacts,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

module.exports = router;
