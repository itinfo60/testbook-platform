import prisma from '../../config/prisma.js';
import { Request, Response } from 'express';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { CustomRequest } from '../auth/auth.controller.js';

export const createTicket = catchAsync(async (req: CustomRequest, res: Response) => {
  const {
    name,
    email,
    subject,
    message,
    description,
    category = 'General',
    priority = 'medium',
  } = req.body;

  let userName = name;
  let userEmail = email;

  if (req.userId && (!userName || !userEmail)) {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true },
    });
    if (user) {
      userName = userName || user.name;
      userEmail = userEmail || user.email;
    }
  }

  const finalMsg = (message || description || '').trim();
  if (!finalMsg) {
    return res.status(400).json({ success: false, message: 'Message or description is required' });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      name: userName || 'Student',
      email: userEmail || 'support-request@civicsedu.com',
      subject: subject || 'Support Query',
      message: finalMsg,
      category,
      priority,
      status: 'open',
      userId: req.userId || null,
      tenantId: req.tenantId || null,
    },
  });

  return ApiResponse.created(
    res,
    { ticket, ticketId: `EDU-${ticket.id.toString().slice(-6).toUpperCase()}` },
    'Support ticket created successfully'
  );
});

export const getTickets = catchAsync(async (req: CustomRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '15', 10);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.search) {
    filter.OR = [
      { subject: { contains: req.query.search as string, mode: 'insensitive' } },
      { name: { contains: req.query.search as string, mode: 'insensitive' } },
      { email: { contains: req.query.search as string, mode: 'insensitive' } },
      { message: { contains: req.query.search as string, mode: 'insensitive' } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supportTicket.count({ where: filter }),
  ]);

  return ApiResponse.paginated(res, {
    docs: tickets,
    page,
    limit,
    total,
  });
});

export const updateTicket = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { status, priority, reply } = req.body;

  const updateData: any = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (reply) {
    updateData.reply = reply;
    updateData.repliedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
  });

  return ApiResponse.success(res, { ticket }, 'Ticket updated successfully');
});

export const replyTicket = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { reply, status = 'resolved' } = req.body;

  if (!reply?.trim()) {
    return res.status(400).json({ success: false, message: 'Reply content is required' });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      reply: reply.trim(),
      status,
      repliedAt: new Date(),
    },
  });

  return ApiResponse.success(res, { ticket }, 'Reply sent and ticket updated');
});

export const deleteTicket = catchAsync(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  await prisma.supportTicket.delete({
    where: { id },
  });

  return ApiResponse.success(res, null, 'Ticket deleted successfully');
});
