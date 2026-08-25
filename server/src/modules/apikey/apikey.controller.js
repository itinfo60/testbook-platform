import prisma from '../../config/prisma.js';
import crypto from 'crypto';
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

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      institute: req.tenantId,
      createdBy: req.userId,
      permissions: permissions || ['courses:read'],
      expiresAt,
    },
  });

  // Return raw key once — never stored again
  ApiResponse.created(
    res,
    {
      id: apiKey.id,
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
  const keys = await prisma.apiKey.findMany({
    where: { institute: req.tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  // Exclude keyHash manually if necessary, or let the response handle it
  const safeKeys = keys.map((k) => {
    const { keyHash, ...rest } = k;
    return rest;
  });
  ApiResponse.ok(res, { keys: safeKeys });
});

export const revokeApiKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const key = await prisma.apiKey.updateMany({
    where: { id, institute: req.tenantId },
    data: { isActive: false },
  });
  if (key.count === 0) throw ApiError.notFound('API key not found');
  ApiResponse.ok(res, null, 'API key revoked');
});

// Middleware: authenticate via API key (for external integrations)
export const authenticateApiKey = catchAsync(async (req, _res, next) => {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) return next();

  const keyHash = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findFirst({ where: { keyHash, isActive: true } });

  if (!apiKey) throw ApiError.unauthorized('Invalid API key');
  if (apiKey.expiresAt && apiKey.expiresAt < new Date())
    throw ApiError.unauthorized('API key expired');

  // Update last used
  setImmediate(() =>
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {})
  );

  req.apiKey = apiKey;
  req.tenantId = apiKey.institute.toString();
  req.apiKeyPermissions = apiKey.permissions;
  next();
});
