import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, enum: ['SECURITY', 'AUTH', 'DATA', 'SYSTEM'], required: true },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', AuditLogSchema);
