import crypto from 'crypto';

export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + crypto.randomBytes(3).toString('hex');
};

export const generateOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

export const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const calculatePercentage = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  return obj;
};

export const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export const omit = (object, keys) => {
  return Object.keys(object).reduce((obj, key) => {
    if (!keys.includes(key)) obj[key] = object[key];
    return obj;
  }, {});
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDateRange = (period) => {
  const now = new Date();
  const ranges = {
    today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    week: new Date(now.getTime() - 7 * 86400000),
    month: new Date(now.getFullYear(), now.getMonth(), 1),
    lastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    year: new Date(now.getFullYear(), 0, 1),
  };
  return { start: ranges[period] || ranges.month, end: now };
};
