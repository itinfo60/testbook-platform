import mongoose, { Schema, Document } from 'mongoose';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  content: string;
  threadId: string;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    threadId: { type: String, required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
  }
);

messageSchema.plugin(tenantPlugin);

if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
