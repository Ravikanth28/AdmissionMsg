const axios = require('axios');

function getUltraConfig() {
  return {
    instanceId: process.env.ULTRAMSG_INSTANCE_ID,
    token: process.env.ULTRAMSG_TOKEN,
    baseUrl: `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}`,
  };
}

function extractMsg(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function checkUltraResponse(data, type) {
  const sent = String(data.sent).toLowerCase();
  if (sent !== 'true') {
    const msg = extractMsg(data.message) || extractMsg(data.error) || `Failed to send ${type}`;
    throw new Error(msg);
  }
  return data;
}

async function sendTextMessage(to, text) {
  const { baseUrl, token } = getUltraConfig();
  const response = await axios.post(
    `${baseUrl}/messages/chat`,
    { token, to, body: text },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'text');
}

async function sendImageMessage(to, imageUrl, caption = '') {
  const { baseUrl, token } = getUltraConfig();
  const response = await axios.post(
    `${baseUrl}/messages/image`,
    { token, to, image: imageUrl, caption },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'image');
}

async function sendVideoMessage(to, videoUrl, caption = '') {
  const { baseUrl, token } = getUltraConfig();
  const response = await axios.post(
    `${baseUrl}/messages/video`,
    { token, to, video: videoUrl, caption },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'video');
}

async function sendDocumentMessage(to, docUrl, filename = 'document') {
  const { baseUrl, token } = getUltraConfig();
  const response = await axios.post(
    `${baseUrl}/messages/document`,
    { token, to, document: docUrl, filename },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'document');
}

async function sendCampaignMessage(to, messageText, mediaFiles = []) {
  const results = [];
  const errors = [];

  // Send text first (attach as caption to first image if present)
  if (messageText && messageText.trim()) {
    const firstImage = mediaFiles.find(m => m.media_type === 'image');
    if (firstImage) {
      console.log(`[SEND] image+caption → ${to} | url: ${firstImage.cloudinary_url}`);
      try {
        const result = await sendImageMessage(to, firstImage.cloudinary_url, messageText);
        results.push({ type: 'image+text', success: true, data: result });
      } catch (e) {
        console.error(`[SEND ERR] image+caption → ${to} | ${e.message}`);
        // fall back to plain text
        console.log(`[SEND] text (fallback) → ${to}`);
        const result = await sendTextMessage(to, messageText);
        results.push({ type: 'text', success: true, data: result });
        errors.push(`image caption failed (${e.message}), sent text only`);
      }
    } else {
      console.log(`[SEND] text → ${to}`);
      // This throw is intentional – if text itself fails, mark contact failed
      const result = await sendTextMessage(to, messageText);
      results.push({ type: 'text', success: true, data: result });
    }
  }

  // Send remaining media files — each with its own try/catch so one failure doesn't block others
  for (const media of mediaFiles) {
    // Skip the first image already sent as caption above
    if (media.media_type === 'image' && messageText && media === mediaFiles.find(m => m.media_type === 'image')) {
      continue;
    }

    try {
      if (media.media_type === 'image') {
        console.log(`[SEND] image → ${to} | url: ${media.cloudinary_url}`);
        const result = await sendImageMessage(to, media.cloudinary_url);
        results.push({ type: 'image', success: true, data: result });
      } else if (media.media_type === 'video') {
        console.log(`[SEND] video → ${to} | url: ${media.cloudinary_url}`);
        const result = await sendVideoMessage(to, media.cloudinary_url);
        results.push({ type: 'video', success: true, data: result });
      } else {
        console.log(`[SEND] ${media.media_type} → ${to} | url: ${media.cloudinary_url} | file: ${media.file_name}`);
        const result = await sendDocumentMessage(to, media.cloudinary_url, media.file_name);
        results.push({ type: media.media_type, success: true, data: result });
      }
    } catch (e) {
      console.error(`[SEND ERR] ${media.media_type} → ${to} | file: ${media.file_name} | url: ${media.cloudinary_url} | error: ${e.message}`);
      errors.push(`${media.media_type} "${media.file_name}" failed: ${e.message}`);
      results.push({ type: media.media_type, success: false, error: e.message, file: media.file_name });
    }
  }

  // If every attempt failed, propagate a combined error
  if (results.length > 0 && results.every(r => !r.success)) {
    throw new Error(errors.join('; '));
  }

  // Attach partial errors to results so caller can log them
  if (errors.length) results._warnings = errors;
  return results;
}

module.exports = { sendTextMessage, sendImageMessage, sendVideoMessage, sendDocumentMessage, sendCampaignMessage };
