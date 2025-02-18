const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const { corsOptions, model, SYSTEM_PROMPT } = require('./config');

const app = express();

// Configurar middlewares en el orden correcto
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Configurar multer para manejar archivos
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

// Endpoint principal para el chat
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Combinar el system prompt con el prompt del usuario
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUsuario: ${prompt}\n\nCopyXpert:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      response: text,
      isAI: true,
      username: "CopyXpert",
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para manejar archivos
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Procesar el archivo y generar una respuesta
    const fileContent = req.file.buffer.toString('base64');
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: 'Analiza este contenido:', inline_data: { mime_type: req.file.mimetype, data: fileContent } }] }
      ]
    });

    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      isAI: true,
      username: "CopyXpert",
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
