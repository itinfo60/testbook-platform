import { prisma } from '../config/prisma.js';
import { getTenantId } from '../utils/TenantContext.js';
import logger from '../utils/logger.js';

const AUDITED_ACTIONS = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

const RESOURCE_MAP = {
  '/courses': 'course',
  '/tests': 'test',
  '/enrollments': 'enrollment',
  '/users': 'user',
  '/payments': 'payment',
  '/live-classes': 'liveclass',
  '/auth': 'auth',
  '/institute': 'institute',
  '/subscriptions': 'subscription',
};

function resolveResource(path) {
  for (const [prefix, name] of Object.entries(RESOURCE_MAP)) {
    if (path.includes(prefix)) return name;
  }
  return 'unknown';
}

export function auditLog(req, res, next) {
  if (!AUDITED_ACTIONS[req.method]) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Fire-and-forget — never block the response
    setImmediate(async () => {
      try {
        const tenantId = getTenantId();
        const auditEntry = {
          tenantId: tenantId || null,
          actorId: req.userId || null,
          actorEmail: req.user?.email || null,
          actorRole: req.user?.role || null,
          action: AUDITED_ACTIONS[req.method],
          resource: resolveResource(req.path),
          resourceId: req.params?.id || null,
          metadata: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            path: req.path,
          },
          status: res.statusCode < 400 ? 'success' : 'failure',
          errorMessage: res.statusCode >= 400 ? body?.message : undefined,
        };

        if (prisma.auditLog) {
          await prisma.auditLog.create({ data: auditEntry });
        } else {
          logger.info('[AUDIT]', auditEntry);
        }
      } catch (err) {
        // Silently ignore audit failures — never disrupt main flow
        logger.debug('Audit logging error:', err?.message);
      }
    });
    return originalJson(body);
  };

  next();
}
