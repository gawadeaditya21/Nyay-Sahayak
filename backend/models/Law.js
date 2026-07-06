import mongoose from "mongoose";

const LawSchema = new mongoose.Schema({
    title: { type: String, required: true },
    size: { type: String, required: true },
    status: { type: String, enum: ['indexing', 'indexed', 'failed'], default: 'indexing' },
    actName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Law', LawSchema);
