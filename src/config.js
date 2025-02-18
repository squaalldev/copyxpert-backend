require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getModel('gemini-pro');

module.exports = { model, corsOptions };
