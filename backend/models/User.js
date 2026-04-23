import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferredLanguage: { type: String, default: "en" },
    plan: { type: String, enum: ['free', 'plus', 'pro'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: { type: String, enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'none'], default: 'none' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);