import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    encryptedContent: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', MessageSchema);
