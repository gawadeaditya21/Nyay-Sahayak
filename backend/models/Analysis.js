import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sessionId: { type: String },
    role: { type: String, enum: ['user', 'assistant'] },
    fileName: { type: String },
    // Yahan hum encrypted masked text store karenge
    encryptedContent: { type: String, required: true },
    maskingSummary: { type: Object }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Analysis', AnalysisSchema);