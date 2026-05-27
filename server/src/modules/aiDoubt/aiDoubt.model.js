import mongoose from 'mongoose';

const aiDoubtSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  answer: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const AiDoubt = mongoose.model('AiDoubt', aiDoubtSchema);
export default AiDoubt;
