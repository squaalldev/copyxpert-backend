const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOptions } = require('./config');
const apiRouter = require('./api');

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});