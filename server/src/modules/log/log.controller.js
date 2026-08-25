import logService from './log.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

class LogController {
  /**
   * Public/Authenticated endpoint for client and admin telemetry ingestion
   */
  ingest = catchAsync(async (req, res) => {
    const rawLogs = req.body.logs || req.body;
    const reqContext = {
      app: req.body.app || (req.headers['x-app-source'] === 'admin' ? 'admin' : 'client'),
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id || req.user?._id || req.body.userId || null,
      userEmail: req.user?.email || req.body.userEmail || null,
      userName: req.user?.name || req.body.userName || null,
      tenantId: req.tenantId || req.user?.tenantId || null,
    };

    const result = await logService.ingestLogs(rawLogs, reqContext);
    return ApiResponse.created(res, { ingested: result.count }, 'Logs ingested successfully');
  });

  /**
   * Admin-only query endpoint with filters & pagination
   */
  list = catchAsync(async (req, res) => {
    const data = await logService.getLogs(req.query);
    return ApiResponse.paginated(res, {
      docs: data.logs,
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
    });
  });

  /**
   * Admin-only statistics overview
   */
  stats = catchAsync(async (req, res) => {
    const stats = await logService.getStats();
    return ApiResponse.ok(res, stats, 'Log statistics retrieved');
  });

  /**
   * Admin-only purge older logs
   */
  purge = catchAsync(async (req, res) => {
    const days = parseInt(req.body.days) || 30;
    const result = await logService.purgeOldLogs(days);
    return ApiResponse.ok(res, result, `Purged logs older than ${days} days`);
  });
}

export default new LogController();
