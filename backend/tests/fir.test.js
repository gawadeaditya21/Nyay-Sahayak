import { jest } from "@jest/globals";
import request from "supertest";
import FIR from "../models/FIR.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./helpers/testDb.js";
import { createUserAndToken } from "./helpers/auth.js";

let lastComplaintInput = "";

jest.unstable_mockModule("../services/aiService.js", () => ({
  analyzeDocument: async () => ({
    documentType: "Agreement",
    detectedType: "legal",
    summary: "OK",
    legacyRisks: [],
    chunksProcessed: 1,
    contextUsed: false,
    contextCount: 0,
    structured: {
      document_type: "Agreement",
      classification: "NORMAL",
      decision: "SAFE_TO_USE",
      risk_level: "LOW",
      confidence_score: 90,
      key_warning: "",
      simple_explanation: "OK",
      smart_explanation: "OK",
      top_risks: [],
      detected_risks: [],
      what_user_should_do: [],
      law_reference: [],
    },
  }),
  analyzeLegalQuery: async () => ({
    topic: "Legal Guidance",
    simple_explanation: "OK",
    rules: [],
    penalties: [],
    user_guidance: [],
    contextUsed: false,
    contextCount: 0,
  }),
  detectDocumentType: () => "legal",
  extractTextFromDocx: async () => ({ text: "docx", method: "mammoth-docx" }),
  generateComplaintLetter: async (input, options = {}) => {
    lastComplaintInput = input;
    if (options.language === "mr") {
      return "Structured:\nमी ही तक्रार दाखल करत आहे.\n{\"payload\":true}\nNormalized:";
    }

    if (options.language === "hi") {
      return "Structured:\nमैं यह शिकायत दर्ज कर रहा/रही हूँ।\n{\"payload\":true}\nNormalized:";
    }

    return "Structured:\nI am submitting this complaint.\n{\"payload\":true}\nNormalized:";
  },
  generateFirDraft: async (input) => {
    lastComplaintInput = input;
    return "Structured:\nI am submitting this complaint.\n{\"payload\":true}\nNormalized:";
  },
  extractNumericTokens: () => [],
  hasMissingNumericTokens: () => false,
  hasPlaceholders: () => false,
  isLanguageMismatch: () => false,
  isMixedLanguage: () => false,
  parseJSONResponse: (value) => JSON.parse(value),
  removeMarkdownFormatting: (value) => value,
  translateStructuredOutput: async (value) => value,
  truncateText: (value) => value,
}));

jest.unstable_mockModule("pdf-parse", () => (
  async () => ({
    text: "Mock PDF text",
    numpages: 1,
  })
));

const { createTestApp } = await import("./helpers/createTestApp.js");
const app = createTestApp();

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

function makeGuestId() {
  return `guest_${crypto.randomUUID()}`;
}

test("POST /api/generate-complaint succeeds for guest", async () => {
  const response = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      user_input: "Test complaint input",
      language: "en",
      mode: "save",
    })
    .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.complaint_text).toContain("I am submitting this complaint.");
  expect(response.body.complaint_text).not.toMatch(/Structured|Normalized|payload|\{|\}/i);
});

test("POST /api/generate-complaint accepts guided complaint answers", async () => {
  const response = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      fir_answers: {
        incidentType: "Theft",
        incidentDate: "2026-04-20",
        incidentLocation: "MG Road Police Station area",
        incidentDescription: "My phone was stolen from my bag.",
        propertyInvolved: "Yes",
        propertyDetails: "one analog watch around 5000 rupees",
        victimDetails: "Test User, Pune, 9999999999",
      },
      language: "en",
      mode: "save",
    })
    .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.complaint_text).toContain("I am submitting this complaint.");
  expect(response.body.complaint_text).not.toMatch(/Structured|Normalized|payload|\{|\}/i);
  expect(lastComplaintInput).toContain('"incidentType":"Theft"');
  expect(lastComplaintInput).toContain('"propertyDetails":"one analog watch around 5000 rupees"');
  expect(lastComplaintInput).not.toContain("Structured complaint intake");
});

test("POST /api/generate-complaint accepts suspect and property fields cleanly", async () => {
  const response = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      fir_answers: {
        incidentType: "Fraud",
        incidentDescription: "I was cheated in an online payment.",
        suspectDescription: "Unknown person on WhatsApp",
        propertyDetails: "Rs 12,000",
      },
      language: "en",
      mode: "save",
    })
    .expect(200);

  expect(response.body.complaint_text).toContain("I am submitting this complaint.");
  expect(lastComplaintInput).toContain('"suspectDescription":"Unknown person on WhatsApp"');
  expect(lastComplaintInput).toContain('"propertyDetails":"Rs 12,000"');
});

test("Guest limit allows 1 complaint generation", async () => {
  const guestId = makeGuestId();

  await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: guestId,
      sessionId: crypto.randomUUID(),
      user_input: "Test complaint input",
      language: "en",
      mode: "save",
    })
    .expect(200);

  const response = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: guestId,
      sessionId: crypto.randomUUID(),
      user_input: "Test complaint input again",
      language: "en",
      mode: "save",
    })
    .expect(429);

  expect(response.body.error).toBe("LIMIT_EXCEEDED");
});

test("Complaint generation requires input fields", async () => {
  const response = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      language: "en",
      mode: "save",
    })
    .expect(400);

  expect(response.body.error).toBe("USER_INPUT_MISSING");
});

test("Complaint history returns user-specific data", async () => {
  const { token } = await createUserAndToken();
  const sessionId = crypto.randomUUID();

  await request(app)
    .post("/api/generate-complaint")
    .set("Authorization", `Bearer ${token}`)
    .send({
      sessionId,
      user_input: "Test complaint input",
      language: "en",
      mode: "save",
    })
    .expect(200);

  const history = await request(app)
    .get("/api/fir/history?limit=5")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(history.body.success).toBe(true);
  expect(history.body.data[0].sessionId).toBe(sessionId);
});

test("Complaint stored content is encrypted", async () => {
  const { token } = await createUserAndToken();
  const sessionId = crypto.randomUUID();

  await request(app)
    .post("/api/generate-complaint")
    .set("Authorization", `Bearer ${token}`)
    .send({
      sessionId,
      user_input: "Confidential complaint text",
      language: "en",
      mode: "save",
    })
    .expect(200);

  const record = await FIR.findOne({ sessionId }).lean();
  expect(record.encryptedContent.startsWith("v2:")).toBe(true);
  expect(record.encryptedContent).not.toContain("Confidential complaint text");
});

test("Complaint generation supports Hindi and Marathi language inputs", async () => {
  const hindiResponse = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      user_input: "मोबाइल चोरी हो गया",
      language: "hi",
      mode: "save",
    })
    .expect(200);

  const marathiResponse = await request(app)
    .post("/api/generate-complaint")
    .send({
      userId: makeGuestId(),
      sessionId: crypto.randomUUID(),
      user_input: "फोन चोरी झाला",
      language: "mr",
      mode: "save",
    })
    .expect(200);

  expect(hindiResponse.body.complaint_text).toContain("शिकायत दर्ज कर");
  expect(marathiResponse.body.complaint_text).toContain("तक्रार दाखल करत आहे");
  expect(hindiResponse.body.complaint_text).not.toMatch(/[A-Za-z]{4,}/);
  expect(marathiResponse.body.complaint_text).not.toMatch(/[A-Za-z]{4,}/);
});
