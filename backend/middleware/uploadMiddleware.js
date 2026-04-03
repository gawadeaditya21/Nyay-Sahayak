import fs from "fs";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let targetDirectory = "uploads/files/";

    if (file.mimetype === "application/pdf") {
      targetDirectory = "uploads/pdfs/";
    } else if (file.mimetype.startsWith("image/")) {
      targetDirectory = "uploads/images/";
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      targetDirectory = "uploads/docs/";
    }

    fs.mkdirSync(targetDirectory, { recursive: true });
    cb(null, targetDirectory);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Invalid file type. Allowed types: PDF, PNG, JPEG, JPG, GIF, WEBP, DOCX"
      )
    );
  },
});

export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 15MB limit",
        error: "FILE_TOO_LARGE",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      error: "UPLOAD_ERROR",
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: "INVALID_REQUEST",
    });
  }

  next();
};
