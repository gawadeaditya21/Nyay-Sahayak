import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const ML_SCRIPT_PATH = path.join(PROJECT_ROOT, "ml-service", "test_search.py");
const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const RAG_SIMILARITY_THRESHOLD = Number(process.env.RAG_SIMILARITY_THRESHOLD || 0.6);
const MAX_CONTEXT_RESULTS = Number(process.env.RAG_MAX_RESULTS || 3);

function extractJsonFromOutput(output) {
  if (!output) {
    throw new Error("Empty output received from Python search service");
  }

  const trimmedOutput = output.trim();

  try {
    return JSON.parse(trimmedOutput);
  } catch {
    const jsonMatches = trimmedOutput.match(/\{[\s\S]*\}/g);
    const lastJsonBlock = jsonMatches ? jsonMatches[jsonMatches.length - 1] : null;

    if (!lastJsonBlock) {
      throw new Error("Could not find JSON payload in Python output");
    }

    return JSON.parse(lastJsonBlock);
  }
}

function normalizeSearchResult(result) {
  if (typeof result === "string") {
    return {
      text: result,
      score: 0,
    };
  }

  return {
    text: String(result?.text || "").trim(),
    score: Number(result?.score || 0),
  };
}

function runPythonSearch(query) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_BIN, [ML_SCRIPT_PATH, query], {
      cwd: PROJECT_ROOT,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    pythonProcess.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python search service: ${error.message}`));
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Python search service exited with code ${code}${
              stderr ? `: ${stderr.trim()}` : ""
            }`
          )
        );
        return;
      }

      try {
        const payload = extractJsonFromOutput(stdout);
        const results = Array.isArray(payload.results) ? payload.results : [];
        resolve(results.map(normalizeSearchResult));
      } catch (error) {
        reject(new Error(`Invalid Python search response: ${error.message}`));
      }
    });
  });
}

function filterRelevantResults(results, threshold = RAG_SIMILARITY_THRESHOLD, limit = MAX_CONTEXT_RESULTS) {
  return results
    .filter((result) => result.text && Number.isFinite(result.score) && result.score > threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function buildContextString(results) {
  if (!results.length) {
    return "";
  }

  return results
    .map(
      (result, index) =>
        `Context ${index + 1} (relevance ${result.score.toFixed(2)}):\n${result.text}`
    )
    .join("\n\n");
}

export {
  buildContextString,
  filterRelevantResults,
  MAX_CONTEXT_RESULTS,
  RAG_SIMILARITY_THRESHOLD,
  runPythonSearch,
};
