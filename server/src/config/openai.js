import OpenAI from 'openai';
import logger from '../utils/logger.js';

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  logger.info('OpenAI client initialized');
} else {
  logger.warn('OPENAI_API_KEY not set — AI features disabled');
}

export default openai;
