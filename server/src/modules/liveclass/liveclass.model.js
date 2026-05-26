import mongoose from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },

    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60 },
    roomId: { type: String, unique: true, index: true }, // WebRTC room identifier

    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    startedAt: Date,
    endedAt: Date,
    recordingUrl: { type: String, default: '' },

    // Attendance: userId -> joinedAt, leftAt
    attendance: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: Date,
        leftAt: Date,
        duration: { type: Number, default: 0 }, // seconds
      },
    ],

    maxParticipants: { type: Number, default: 200 },
    isRecorded: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

liveClassSchema.virtual('isLive').get(function () {
  return this.status === 'live';
});

liveClassSchema.virtual('attendanceCount').get(function () {
  return this.attendance?.length || 0;
});

liveClassSchema.plugin(paginatePlugin);
liveClassSchema.plugin(tenantPlugin);

const LiveClass = mongoose.model('LiveClass', liveClassSchema);
export default LiveClass;
