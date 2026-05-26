import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' };

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
    return log;
  })
);

const transports = [];
const exceptionHandlers = [];
const rejectionHandlers = [];

if (process.env.NODE_ENV === 'test') {
  transports.push(
    new winston.transports.Console({
      silent: true,
    })
  );
} else {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
  exceptionHandlers.push(
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  );
  rejectionHandlers.push(
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  );

  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize({ all: true }), format),
      })
    );
  }
}

const logger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format,
  transports,
  ...(exceptionHandlers.length && { exceptionHandlers }),
  ...(rejectionHandlers.length && { rejectionHandlers }),
});

export default logger;
