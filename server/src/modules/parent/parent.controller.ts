import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { ParentService } from './parent.service.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string;
}

export class ParentController extends BaseController {
  private readonly parentService: ParentService;

  constructor() {
    super();
    this.parentService = new ParentService();
  }

  generateAccessCode = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const code = await this.parentService.generateAccessCode(req.userId!);
    return this.ok(res, { code }, 'Access code generated');
  });

  linkStudent = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { code } = req.body;
    const student = await this.parentService.linkStudent(req.userId!, code);
    return this.ok(res, { student }, 'Student linked successfully');
  });

  getLinkedStudents = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const students = await this.parentService.getLinkedStudents(req.userId!);
    return this.ok(res, { students });
  });

  getStudentProgress = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { studentId } = req.params;
    const progress = await this.parentService.getStudentProgress(req.userId!, studentId);
    return this.ok(res, { progress });
  });

  // === MESSAGING CONTROLLERS ===

  getTeachersForStudent = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { studentId } = req.params;
    const teachers = await this.parentService.getTeachersForStudent(req.userId!, studentId);
    return this.ok(res, { teachers });
  });

  getThreadMessages = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { threadId } = req.params;
    const messages = await this.parentService.getThreadMessages(req.userId!, threadId);
    return this.ok(res, { messages });
  });

  getActiveThreads = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const threads = await this.parentService.getActiveThreads(req.userId!);
    return this.ok(res, { threads });
  });

  sendMessage = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { recipientId, studentId, content } = req.body;
    const message = await this.parentService.sendMessage(
      req.userId!,
      req.tenantId!,
      recipientId,
      studentId,
      content
    );
    return this.created(res, { message }, 'Message sent successfully');
  });
}
