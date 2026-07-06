import mongoose from "mongoose";

const translationCacheSchema = new mongoose.Schema(
  {
    hashKey: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
    },
    translatedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

translationCacheSchema.index({ hashKey: 1, language: 1 }, { unique: true });

export default mongoose.model("TranslationCache", translationCacheSchema);
