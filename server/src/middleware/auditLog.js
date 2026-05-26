import AuditLog from '../modules/audit/audit.model.js';
import { getTenantId } from '../utils/TenantContext.js';

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
        await AuditLog.create({
          tenantId: tenantId || undefined,
          actor: req.userId || undefined,
          actorEmail: req.user?.email,
          actorRole: req.user?.role,
          action: AUDITED_ACTIONS[req.method],
          resource: resolveResource(req.path),
          resourceId: req.params?.id || undefined,
          metadata: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            path: req.path,
          },
          status: res.statusCode < 400 ? 'success' : 'failure',
          errorMessage: res.statusCode >= 400 ? body?.message : undefined,
        });
      } catch {
        // Silently ignore audit failures — never disrupt main flow
      }
    });
    return originalJson(body);
  };

  next();
}
