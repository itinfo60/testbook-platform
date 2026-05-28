import { ApiError } from '../../core/api-error.js';
import User from '../user/user.model.js';
import Course from '../course/course.model.ts';
import Enrollment from '../enrollment/enrollment.model.js';
import Message from './message.model.js';
import { getIO } from '../../sockets/index.js';
import mongoose from 'mongoose';

export class ParentService {
  async generateAccessCode(studentId: string): Promise<string> {
    const student = await User.findById(studentId);
    if (!student) throw ApiError.notFound('Student not found');
    if (student.role !== 'student') throw ApiError.badRequest('User is not a student');

    const code = Math.random().toString().substring(2, 8); // 6 digits
    student.parentAccessCode = code;
    await student.save();

    return code;
  }

  async linkStudent(parentId: string, accessCode: string): Promise<any> {
    const parent = await User.findById(parentId);
    if (!parent) throw ApiError.notFound('Parent not found');
    if (parent.role !== 'parent') throw ApiError.badRequest('User is not a parent');

    const student = await User.findOne({ parentAccessCode: accessCode });
    if (!student) throw ApiError.notFound('Invalid or expired access code');

    // Link them up
    if (!parent.linkedStudents.includes(student._id)) {
      parent.linkedStudents.push(student._id);
      await parent.save();
    }

    // Reset code so it can't be used again
    student.parentAccessCode = undefined;
    await student.save();

    return student;
  }

  async getLinkedStudents(parentId: string): Promise<any[]> {
    const parent = await User.findById(parentId).populate(
      'linkedStudents',
      'name email avatar lastLogin'
    );
    if (!parent) throw ApiError.notFound('Parent not found');

    return parent.linkedStudents;
  }

  async getStudentProgress(parentId: string, studentId: string): Promise<any> {
    const parent = await User.findById(parentId);
    const isLinked = parent?.linkedStudents?.some((id: any) => id.toString() === studentId);
    if (!parent || !isLinked) {
      throw ApiError.forbidden('You do not have access to this student');
    }

    // Fetch enrollments
    const enrollments = await Enrollment.find({ user: studentId }).populate(
      'course',
      'title thumbnail'
    );

    return enrollments;
  }

  // === MESSAGING SERVICES ===

  async getTeachersForStudent(parentId: string, studentId: string): Promise<any[]> {
    const parent = await User.findById(parentId);
    const isLinked = parent?.linkedStudents?.some((id: any) => id.toString() === studentId);
    if (!parent || !isLinked) {
      throw ApiError.forbidden('You do not have access to this student');
    }

    const enrollments = await Enrollment.find({ user: studentId, course: { $exists: true } });
    if (!enrollments.length) return [];

    const courseIds = enrollments.map((e) => e.course);

    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('teacher', 'name email avatar role')
      .lean();

    const teachersMap = new Map();
    for (const c of courses) {
      if (c.teacher) {
        teachersMap.set((c.teacher as any)._id.toString(), c.teacher);
      }
    }

    return Array.from(teachersMap.values());
  }

  async getThreadMessages(userId: string, threadId: string): Promise<any[]> {
    return Message.find({ threadId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email avatar role')
      .populate('recipient', 'name email avatar role')
      .populate('student', 'name')
      .lean();
  }

  async getActiveThreads(userId: string): Promise<any[]> {
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email avatar role')
      .populate('recipient', 'name email avatar role')
      .populate('student', 'name')
      .lean();

    const threadsMap = new Map();
    for (const msg of messages) {
      if (!threadsMap.has(msg.threadId)) {
        threadsMap.set(msg.threadId, msg);
      }
    }
    return Array.from(threadsMap.values());
  }

  async sendMessage(
    senderId: string,
    tenantId: string,
    recipientId: string,
    studentId: string,
    content: string
  ): Promise<any> {
    const [sender, recipient, student] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId),
      User.findById(studentId),
    ]);

    if (!sender || !recipient || !student) {
      throw ApiError.notFound('Sender, recipient, or student not found');
    }

    // Thread ID is deterministic based on student + parent + teacher context
    // E.g. parent_teacher_studentId_teacherId
    const parentId = sender.role === 'parent' ? senderId : recipientId;
    const teacherId = sender.role === 'teacher' ? senderId : recipientId;
    const threadId = `thread_${studentId}_${parentId}_${teacherId}`;

    const message = await Message.create({
      sender: new mongoose.Types.ObjectId(senderId),
      recipient: new mongoose.Types.ObjectId(recipientId),
      student: new mongoose.Types.ObjectId(studentId),
      content,
      threadId,
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email avatar role')
      .populate('recipient', 'name email avatar role')
      .populate('student', 'name')
      .lean();

    // Socket.IO Emit
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('parent_teacher_message', populated);
      io.to(`user:${senderId}`).emit('parent_teacher_message', populated);
    }

    return populated;
  }
}

export default ParentService;
