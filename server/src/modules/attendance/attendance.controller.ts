import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { Attendance } from './attendance.model.js';
import Course from '../course/course.model.ts';
import { ApiError } from '../../core/api-error.js';

export class AttendanceController extends BaseController {
  getAttendance = this.catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { date } = req.query;

    if (!date) {
      throw ApiError.badRequest('Date query parameter is required');
    }

    const attendance = await Attendance.findOne({
      course: courseId,
      date: new Date(date as string),
    }).populate('records.student', 'name email avatar');

    return this.ok(res, { attendance });
  });

  saveAttendance = this.catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { date, records } = req.body;

    if (!date || !records) {
      throw ApiError.badRequest('Date and records are required');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const attendanceDate = new Date(date);

    let attendance = await Attendance.findOne({ course: courseId, date: attendanceDate });

    if (attendance) {
      attendance.records = records;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        course: courseId,
        date: attendanceDate,
        records,
      });
    }

    return this.ok(res, { attendance }, 'Attendance saved successfully');
  });
}
