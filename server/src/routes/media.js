const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { getPool } = require('../config/database');

// Upload media file to Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { campaignId } = req.body;
    if (!campaignId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    // Determine media type
    const mediaType = getMediaType(req.file.mimetype);
    const isRaw = mediaType === 'pdf' || mediaType === 'document';

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path, {
      folder: `admission-msg/${campaignId}`,
      resource_type: mediaType === 'video' ? 'video' : isRaw ? 'raw' : 'image',
      use_filename: true,
      unique_filename: true,
    });

    // For PDFs and documents, inject fl_attachment so WhatsApp can download them properly
    // Cloudinary raw URLs without fl_attachment are served without a forced content-type
    // and WhatsApp's media downloader silently drops them
    const deliveryUrl = isRaw
      ? cloudinaryResult.url.replace('/upload/', '/upload/fl_attachment/')
      : cloudinaryResult.url;

    // Clean up local file
    fs.unlinkSync(req.file.path);

    // Save to database
    const db = getPool();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO campaign_media (id, campaign_id, media_type, file_name, cloudinary_url, cloudinary_public_id, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, campaignId, mediaType, req.file.originalname, deliveryUrl, cloudinaryResult.publicId, cloudinaryResult.size]
    );

    res.json({
      success: true,
      media: {
        id,
        campaignId,
        mediaType,
        fileName: req.file.originalname,
        url: deliveryUrl,
        size: cloudinaryResult.size,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to upload media' });
  }
});

// Get media for a campaign
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM campaign_media WHERE campaign_id = ? ORDER BY created_at',
      [req.params.campaignId]
    );
    res.json({ media: rows });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Delete media
router.delete('/:id', async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM campaign_media WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = rows[0];
    const resourceType = media.media_type === 'video' ? 'video' : media.media_type === 'image' ? 'image' : 'raw';
    
    await deleteFromCloudinary(media.cloudinary_public_id, resourceType);
    await db.execute('DELETE FROM campaign_media WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  return 'document';
}

module.exports = router;
