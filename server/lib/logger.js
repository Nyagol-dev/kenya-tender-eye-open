const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define file streams for errors and combined logs
const errorStream = pino.destination(path.join(logDir, 'error.log')); // errors only
const combinedStream = pino.destination(path.join(logDir, 'combined.log')); // all logs


// Create multistream configuration
const streams = [
  { level: 'error', stream: errorStream },
  { level: 'info', stream: combinedStream },
];

// In development, add a pretty console transport
if (!isProd) {
  streams.unshift({
    level: 'debug',
    stream: pino.transport({
      target: 'pino-pretty',
      options: { colorize: true },
    }),
  });
}

const logger = pino(
  {
    level: isProd ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
    // Ensure log output includes the level, timestamp, and message with any extra metadata
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.multistream(streams)
);

module.exports = logger;
