const express = require('express');
const { model } = require('./config');
const SYSTEM_PROMPT = require('./config/systemPrompt');

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, file } = req.body;
    const result = await model.generateContent({
      contents: [
        SYSTEM_PROMPT,
        { role: "user", parts: [prompt] }
      ]
    });
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
