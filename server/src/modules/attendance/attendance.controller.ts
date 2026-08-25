import prisma from '../../config/prisma.js';
import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { ApiError } from '../../core/api-error.js';

export class AttendanceController extends BaseController {
  getAttendance = this.catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw ApiError.badRequest('Date query parameter is required');
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        course: courseId,
        date: new Date(date as string),
      },
    });

    return this.ok(res, { attendance });
  });

  saveAttendance = this.catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { date, records } = req.body;

    if (!date || !records) {
      throw ApiError.badRequest('Date and records are required');
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const attendanceDate = new Date(date);

    let attendance = await prisma.attendance.findFirst({
      where: { course: courseId, date: attendanceDate },
    });

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { records },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          course: courseId,
          date: attendanceDate,
          records,
        },
      });
    }

    return this.ok(res, { attendance }, 'Attendance saved successfully');
  });
}
