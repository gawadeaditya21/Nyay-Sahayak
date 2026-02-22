import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysisRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", analysisRoutes);
app.use("/api", ocrRoutes);
app.use("/api/pdf", pdfRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});