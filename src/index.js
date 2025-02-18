const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOptions } = require('./config');

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { model } = require('./config');
    const { prompt } = req.body;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ response: text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
