import mongoose, { Schema, Document } from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

export interface IAttendance extends Document {
  tenantId: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  date: Date;
  records: {
    student: mongoose.Types.ObjectId;
    status: 'present' | 'absent' | 'late';
    remarks?: string;
  }[];
}

const attendanceSchema = new Schema<IAttendance>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    date: { type: Date, required: true },
    records: [
      {
        student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
        remarks: { type: String },
      },
    ],
  },
  { timestamps: true }
);

attendanceSchema.plugin(tenantPlugin);

attendanceSchema.index({ course: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
