const axios = require('axios');

// Parse all configured UltraMsg instances.
// Supports multiple instances via comma-separated env vars:
//   ULTRAMSG_INSTANCE_IDS=inst1,inst2,inst3
//   ULTRAMSG_TOKENS=token1,token2,token3
// Single-instance legacy vars still work:
//   ULTRAMSG_INSTANCE_ID=inst1  ULTRAMSG_TOKEN=token1
function getAllInstances() {
  const ids = process.env.ULTRAMSG_INSTANCE_IDS
    ? process.env.ULTRAMSG_INSTANCE_IDS.split(',').map(s => s.trim()).filter(Boolean)
    : process.env.ULTRAMSG_INSTANCE_ID
    ? [process.env.ULTRAMSG_INSTANCE_ID.trim()]
    : [];

  const tokens = process.env.ULTRAMSG_TOKENS
    ? process.env.ULTRAMSG_TOKENS.split(',').map(s => s.trim()).filter(Boolean)
    : process.env.ULTRAMSG_TOKEN
    ? [process.env.ULTRAMSG_TOKEN.trim()]
    : [];

  if (ids.length === 0) throw new Error('No UltraMsg instances configured');

  return ids.map((instanceId, i) => ({
    instanceId,
    token: tokens[i] || tokens[0],
    baseUrl: `https://api.ultramsg.com/${instanceId}`,
  }));
}

// Pick instance by contact index (round-robin)
function getInstance(contactIndex = 0) {
  const instances = getAllInstances();
  const index = contactIndex % instances.length;
  const picked = instances[index];
  console.log(`[INSTANCE_SELECT] contactIndex=${contactIndex}, instances.length=${instances.length}, using index=${index} → ${picked.instanceId}`);
  return picked;
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

async function sendTextMessage(to, text, contactIndex = 0) {
  const { baseUrl, token } = getInstance(contactIndex);
  const response = await axios.post(
    `${baseUrl}/messages/chat`,
    { token, to, body: text },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'text');
}

async function sendImageMessage(to, imageUrl, caption = '', contactIndex = 0) {
  const { baseUrl, token } = getInstance(contactIndex);
  const response = await axios.post(
    `${baseUrl}/messages/image`,
    { token, to, image: imageUrl, caption },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'image');
}

async function sendVideoMessage(to, videoUrl, caption = '', contactIndex = 0) {
  const { baseUrl, token } = getInstance(contactIndex);
  const response = await axios.post(
    `${baseUrl}/messages/video`,
    { token, to, video: videoUrl, caption },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'video');
}

async function sendDocumentMessage(to, docUrl, filename = 'document', contactIndex = 0) {
  const { baseUrl, token } = getInstance(contactIndex);
  const response = await axios.post(
    `${baseUrl}/messages/document`,
    { token, to, document: docUrl, filename },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return checkUltraResponse(response.data, 'document');
}

async function isOnWhatsApp(to, contactIndex = 0) {
  const { baseUrl, token } = getInstance(contactIndex);
  const chatId = to.replace(/\D/g, '') + '@c.us';
  try {
    const response = await axios.get(`${baseUrl}/contacts/check`, {
      params: { token, chatId },
    });
    const data = response.data;
    // UltraMsg returns { status: "valid" } or { status: "invalid" }
    return data && (data.status === 'valid' || data.numberExists === true || data.onWhatsapp === true);
  } catch (e) {
    console.error(`[CHECK] could not verify ${to}: ${e.message}`);
    // On check error, allow sending (don't block on API errors)
    return true;
  }
}

async function sendCampaignMessage(to, messageText, mediaFiles = [], contactIndex = 0) {
  const results = [];
  const errors = [];

  // Send text first (attach as caption to first image if present)
  if (messageText && messageText.trim()) {
    const firstImage = mediaFiles.find(m => m.media_type === 'image');
    if (firstImage) {
      console.log(`[SEND] image+caption → ${to} | url: ${firstImage.cloudinary_url}`);
      try {
        const result = await sendImageMessage(to, firstImage.cloudinary_url, messageText, contactIndex);
        results.push({ type: 'image+text', success: true, data: result });
      } catch (e) {
        console.error(`[SEND ERR] image+caption → ${to} | ${e.message}`);
        console.log(`[SEND] text (fallback) → ${to}`);
        const result = await sendTextMessage(to, messageText, contactIndex);
        results.push({ type: 'text', success: true, data: result });
        errors.push(`image caption failed (${e.message}), sent text only`);
      }
    } else {
      console.log(`[SEND] text → ${to}`);
      const result = await sendTextMessage(to, messageText, contactIndex);
      results.push({ type: 'text', success: true, data: result });
    }
  }

  // Send remaining media — each with its own try/catch
  for (const media of mediaFiles) {
    if (media.media_type === 'image' && messageText && media === mediaFiles.find(m => m.media_type === 'image')) {
      continue;
    }

    try {
      if (media.media_type === 'image') {
        console.log(`[SEND] image → ${to} | url: ${media.cloudinary_url}`);
        const result = await sendImageMessage(to, media.cloudinary_url, '', contactIndex);
        results.push({ type: 'image', success: true, data: result });
      } else if (media.media_type === 'video') {
        console.log(`[SEND] video → ${to} | url: ${media.cloudinary_url}`);
        const result = await sendVideoMessage(to, media.cloudinary_url, '', contactIndex);
        results.push({ type: 'video', success: true, data: result });
      } else {
        console.log(`[SEND] ${media.media_type} → ${to} | url: ${media.cloudinary_url} | file: ${media.file_name}`);
        const result = await sendDocumentMessage(to, media.cloudinary_url, media.file_name, contactIndex);
        results.push({ type: media.media_type, success: true, data: result });
      }
    } catch (e) {
      console.error(`[SEND ERR] ${media.media_type} → ${to} | file: ${media.file_name} | error: ${e.message}`);
      errors.push(`${media.media_type} "${media.file_name}" failed: ${e.message}`);
      results.push({ type: media.media_type, success: false, error: e.message, file: media.file_name });
    }
  }

  if (results.length > 0 && results.every(r => !r.success)) {
    throw new Error(errors.join('; '));
  }

  if (errors.length) results._warnings = errors;
  return results;
}

module.exports = { sendTextMessage, sendImageMessage, sendVideoMessage, sendDocumentMessage, sendCampaignMessage, isOnWhatsApp };
