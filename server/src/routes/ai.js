const express = require('express');
const router = express.Router();
const axios = require('axios');

// Enhance message with Cerebras AI
router.post('/enhance', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are a professional message writer. The user will provide a draft message intended to be sent via WhatsApp for ${context || 'admission/communication'} purposes. 
Your task is to:
1. Correct grammar, spelling, and punctuation
2. Make it professional yet friendly and approachable
3. Keep the core meaning and intent intact
4. Format it appropriately for WhatsApp (use *bold*, _italic_ where appropriate)
5. Keep it concise but complete
6. Add appropriate greeting and sign-off if missing
7. Do NOT add any placeholder text - only enhance what's given

Return ONLY the enhanced message text, nothing else.`;

    const response = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        model: 'llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const enhancedMessage = response.data.choices[0].message.content;

    res.json({
      success: true,
      original: message,
      enhanced: enhancedMessage,
    });
  } catch (error) {
    console.error('AI enhance error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to enhance message. Please check your Cerebras API key.' });
  }
});

module.exports = router;
