import { jest } from "@jest/globals";

const modelCalls = [];

function respondToPrompt(prompt) {
  modelCalls.push(prompt);

  if (prompt.includes("Translate the following complaint letter into Marathi")) {
    return "मी ही तक्रार नोंदवत आहे.\nधन्यवाद.";
  }

  if (prompt.includes("Generate a formal police complaint letter in Marathi")) {
    return "Structured complaint intake:\nI am filing this complaint.\n{\"payload\":true}\nNormalized answer payload:";
  }

  if (prompt.includes("Generate a formal police complaint letter in English")) {
    return "Structured complaint intake:\nI am filing this complaint.\n{\"payload\":true}\nNormalized answer payload:";
  }

  return "Structured complaint intake:\nI am filing this complaint.\n{\"payload\":true}\nNormalized answer payload:";
}

jest.unstable_mockModule("../config/gemini.js", () => ({
  geminiModel: {
    generateContent: async (prompt) => ({
      response: {
        text: () => respondToPrompt(prompt),
      },
    }),
  },
  genAI: {
    getGenerativeModel: () => ({
      generateContent: async (prompt) => ({
        response: {
          text: () => respondToPrompt(prompt),
        },
      }),
    }),
  },
}));

const { generateComplaintLetter } = await import("../services/aiService.js");

beforeEach(() => {
  modelCalls.length = 0;
});

test("generateComplaintLetter removes JSON/debug output for English", async () => {
  const complaint = await generateComplaintLetter(
    {
      incidentType: "Theft",
      incidentDescription: "My phone was stolen.",
      suspectDescription: "Unknown person",
    },
    { language: "en" }
  );

  expect(complaint).toContain("I am filing this complaint.");
  expect(complaint).not.toMatch(/Structured|Normalized|payload|\{|\}/i);
  expect(complaint).not.toMatch(/[\r\n]{3,}/);
  expect(modelCalls[0]).toContain("Generate a formal police complaint letter in English.");
});

test("generateComplaintLetter returns Marathi only when Marathi is requested", async () => {
  const complaint = await generateComplaintLetter(
    {
      incidentType: "Theft",
      incidentDescription: "माझा फोन चोरी झाला.",
      propertyDetails: "फोन",
    },
    { language: "mr" }
  );

  expect(complaint).toContain("मी ही तक्रार नोंदवत आहे.");
  expect(complaint).toContain("धन्यवाद.");
  expect(complaint).not.toMatch(/Structured|Normalized|payload|\{|\}/i);
  expect(complaint).not.toMatch(/[A-Za-z]{4,}/);
  expect(modelCalls[0]).toContain("Generate a formal police complaint letter in Marathi.");
  expect(modelCalls.some((prompt) => prompt.includes("Translate the following complaint letter into Marathi"))).toBe(true);
});
