import { extractTextFromPDF } from '../utils/fileExtractor.js';
import { chunkText } from '../services/aiService.js';
import HybridRagService from '../services/hybridRagService.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import FIR from '../models/FIR.js';
import ChatSession from '../models/ChatSession.js';
import Law from '../models/Law.js';
import AuditLog from '../models/AuditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
const collectionName = process.env.QDRANT_COLLECTION_NAME || 'legal_documents';

// Helper for audit logs
const logAction = async (userStr, action, target, type, ip) => {
    try {
        await AuditLog.create({ user: userStr, action, target, type, ip });
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeCases = await FIR.countDocuments();
        const apiRequests = await ChatSession.countDocuments(); // mock mapping for now
        const docsProcessed = await Law.countDocuments();

        const recentActivity = await AuditLog.find().sort({ createdAt: -1 }).limit(5);

        res.json({
            stats: { totalUsers, activeCases, apiRequests, docsProcessed },
            recentActivity
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ msg: "User not found" });

        await logAction(req.user.name, "Changed user role", `${user.name} -> ${role.toUpperCase()}`, "SECURITY", req.ip || "127.0.0.1");

        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await logAction(req.user.name, "Deleted User Account", user.email, "SECURITY", req.ip || "127.0.0.1");

        res.json({ msg: "User deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const getLaws = async (req, res) => {
    try {
        const laws = await Law.find().sort({ createdAt: -1 });
        res.json(laws);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const deleteLaw = async (req, res) => {
    try {
        const law = await Law.findByIdAndDelete(req.params.id);
        if (!law) return res.status(404).json({ msg: "Law not found" });

        // Delete from Qdrant by actName payload
        try {
            await qdrantClient.delete(collectionName, {
                filter: {
                    must: [
                        { key: "act", match: { value: law.actName } }
                    ]
                }
            });
        } catch(qdrantErr) {
            console.error("Failed to delete from Qdrant:", qdrantErr);
        }

        await logAction(req.user.name, "Deleted Law Document", law.title, "DATA", req.ip || "127.0.0.1");

        res.json({ msg: "Law deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

export const uploadLaw = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
        const metadataTitle = req.body.title || req.file.originalname;
        const actName = req.body.actName || "Unknown Act";
        const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

        // Create Law record in MongoDB
        const lawRecord = await Law.create({
            title: metadataTitle,
            actName: actName,
            size: fileSizeMB,
            status: 'indexing'
        });

        let text = "";
        if (mimeType === "application/pdf") {
            const result = await extractTextFromPDF(filePath);
            text = result.text;
        } else {
            lawRecord.status = 'failed';
            await lawRecord.save();
            return res.status(400).json({ success: false, message: "Only PDF laws supported." });
        }

        const chunks = chunkText(text, 1200); 
        const points = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunkId = crypto.randomUUID();
            const textToEmbed = `Title: ${metadataTitle}\nAct: ${actName}\n\n${chunks[i]}`;
            const vector = await HybridRagService.embedQuery(textToEmbed);
            points.push({
                id: chunkId,
                vector: vector,
                payload: {
                    text: chunks[i],
                    metadata: { act: actName, title: metadataTitle, source: "admin_upload", chunk_index: i }
                }
            });
            await new Promise(r => setTimeout(r, 50));
        }

        const batchSize = 25;
        for (let i = 0; i < points.length; i += batchSize) {
            const batch = points.slice(i, i + batchSize);
            await qdrantClient.upsert(collectionName, { wait: true, points: batch });
        }

        lawRecord.status = 'indexed';
        await lawRecord.save();

        await logAction(req.user.name, "Uploaded Law Document", metadataTitle, "DATA", req.ip || "127.0.0.1");

        res.status(200).json({ success: true, message: `Law indexed.`, chunks_added: points.length, law: lawRecord });
        
    } catch (error) {
        console.error("❌ [Admin] Upload failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
