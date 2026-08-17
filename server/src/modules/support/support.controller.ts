import { Request, Response } from 'express';
import SupportTicket from './supportTicket.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { CustomRequest } from '../auth/auth.controller.js';

export const createTicket = catchAsync(async (req: CustomRequest, res: Response) => {
  const { name, email, subject, message, priority } = req.body;

  const ticket = await SupportTicket.create({
    name,
    email,
    subject,
    message,
    priority: priority || 'medium',
    user: req.userId || null,
    tenantId: req.tenantId || null,
  });

  return ApiResponse.created(
    res,
    { ticket, ticketId: `EDU-${ticket._id.toString().slice(-6).toUpperCase()}` },
    'Support ticket created successfully'
  );
});

export const getTickets = catchAsync(async (req: CustomRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, {
    docs: tickets,
    page,
    limit,
    total,
  });
});
