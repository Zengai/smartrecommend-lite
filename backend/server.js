const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const Logger = require('./utils/logger');

const logger = new Logger('Server');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(config.app.port, () => {
  logger.success(`Server running on port ${config.app.port}`);
});
