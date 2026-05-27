import mongoose, { Schema, Model } from 'mongoose';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

export interface IProctoredExam {
  title: string;
  course: mongoose.Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  antiCheatOptions: {
    webcamSnapshot?: boolean;
    screenShare?: boolean;
    idVerification?: boolean;
  };
  tenantId: mongoose.Types.ObjectId;
}

const proctoredExamSchema = new Schema<IProctoredExam>(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    antiCheatOptions: {
      webcamSnapshot: { type: Boolean, default: false },
      screenShare: { type: Boolean, default: false },
      idVerification: { type: Boolean, default: false },
    },
    tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true }
);

proctoredExamSchema.plugin(paginatePlugin);
proctoredExamSchema.plugin(tenantPlugin);

if (mongoose.models.ProctoredExam) {
  delete mongoose.models.ProctoredExam;
}

const ProctoredExam: Model<IProctoredExam> = mongoose.model<IProctoredExam>(
  'ProctoredExam',
  proctoredExamSchema
);
export default ProctoredExam;
