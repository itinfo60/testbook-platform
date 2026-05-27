import AiDoubt from './aiDoubt.model.js';
import { createDoubtSchema, answerDoubtSchema } from './aiDoubt.validation.js';
import llmService from '../../services/llm.service.js'; // adjust path as needed
import catchAsync from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';

class AiDoubtController {
  // Student creates a doubt
  createDoubt = catchAsync(async (req, res) => {
    const { error, value } = createDoubtSchema.safeParse(req.body);
    if (error) throw ApiError.badRequest(error.message);
    const doubt = await AiDoubt.create({
      question: value.question,
      context: value.context,
      student: req.userId,
      tenantId: req.tenantId,
    });
    ApiResponse.created(res, { doubt }, 'Doubt created');
  });

  // Teacher or system answers a doubt synchronously
  answerDoubt = catchAsync(async (req, res) => {
    const { error, value } = answerDoubtSchema.safeParse(req.params);
    if (error) throw ApiError.badRequest(error.message);
    const doubt = await AiDoubt.findOne({ _id: value.doubtId, tenantId: req.tenantId });
    if (!doubt) throw ApiError.notFound('Doubt not found');
    // Call LLM service synchronously (placeholder implementation)
    const answer = await llmService.getAnswer(doubt.question, doubt.context || '');
    doubt.answer = answer;
    await doubt.save();
    ApiResponse.ok(res, { answer }, 'Answer generated');
  });

  // Teacher lists doubts for their courses (or all if admin)
  listMyDoubts = catchAsync(async (req, res) => {
    const filter = { tenantId: req.tenantId };
    if (req.user?.role === 'teacher') {
      filter.teacher = req.userId; // assuming teacher field on doubt (optional)
    }
    const doubts = await AiDoubt.find(filter).sort('-createdAt').lean();
    ApiResponse.ok(res, { doubts }, 'Doubts fetched');
  });
}

export default new AiDoubtController();
