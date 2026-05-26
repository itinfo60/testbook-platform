import crypto from 'crypto';
import ApiKey from './apikey.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

export const createApiKey = catchAsync(async (req, res) => {
  const { name, permissions, expiresInDays } = req.body;
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');

  const rawKey = `tbk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  const apiKey = await ApiKey.create({
    name,
    keyHash,
    keyPrefix,
    institute: req.tenantId,
    createdBy: req.userId,
    permissions: permissions || ['courses:read'],
    expiresAt,
  });

  // Return raw key once — never stored again
  ApiResponse.created(
    res,
    {
      id: apiKey._id,
      name: apiKey.name,
      key: rawKey, // Only time this is shown
      keyPrefix,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
    'API key created. Save the key now — it will not be shown again.'
  );
});

export const listApiKeys = catchAsync(async (req, res) => {
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');
  const keys = await ApiKey.find({ institute: req.tenantId, isActive: true })
    .select('-keyHash')
    .sort({ createdAt: -1 });
  ApiResponse.ok(res, { keys });
});

export const revokeApiKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const key = await ApiKey.findOneAndUpdate(
    { _id: id, institute: req.tenantId },
    { isActive: false },
    { new: true }
  );
  if (!key) throw ApiError.notFound('API key not found');
  ApiResponse.ok(res, null, 'API key revoked');
});

// Middleware: authenticate via API key (for external integrations)
export const authenticateApiKey = catchAsync(async (req, _res, next) => {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) return next();

  const keyHash = hashApiKey(rawKey);
  const apiKey = await ApiKey.findOne({ keyHash, isActive: true }).select('+keyHash');

  if (!apiKey) throw ApiError.unauthorized('Invalid API key');
  if (apiKey.expiresAt && apiKey.expiresAt < new Date())
    throw ApiError.unauthorized('API key expired');

  // Update last used
  setImmediate(() =>
    ApiKey.findByIdAndUpdate(apiKey._id, { lastUsedAt: new Date() }).catch(() => {})
  );

  req.apiKey = apiKey;
  req.tenantId = apiKey.institute.toString();
  req.apiKeyPermissions = apiKey.permissions;
  next();
});
