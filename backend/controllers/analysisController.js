// import { spawn } from "child_process";
// import path from "path";
// import { fileURLToPath } from "url";

// // Fix for __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const analyseText = (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ error: "Text required" });
//   }

//   const pythonPath = path.join(
//     __dirname,
//     "../../ml-service/test_search.py"
//   );

//   const pythonProcess = spawn("python", [pythonPath, text]);

//   let output = "";

//   pythonProcess.stdout.on("data", (data) => {
//     output += data.toString();
//   });

//   pythonProcess.stderr.on("data", (data) => {
//     console.error("Python error:", data.toString());
//   });

//   pythonProcess.on("close", () => {
//     try {
//       const parsed = JSON.parse(output);
//       res.json(parsed);
//     } catch (err) {
//       res.status(500).json({ error: "Invalid Python response" });
//     }
//   });
// };
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const analyseText = (req, res) => {
  const { text } = req.body;

  console.log("Received text from frontend:", text);

  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  const pythonPath = path.join(
    __dirname,
    "../../ml-service/test_search.py"
  );

  console.log("Python file path:", pythonPath);

  const pythonProcess = spawn("python", [pythonPath, text]);

  let output = "";

  pythonProcess.stdout.on("data", (data) => {
    console.log("Python STDOUT:", data.toString());
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python STDERR:", data.toString());
  });

  pythonProcess.on("close", (code) => {
    console.log("Python process exited with code:", code);
    console.log("Final Output:", output);

    // try {
    //   const parsed = JSON.parse(output);
    //   res.json(parsed);
    // } catch (err) {
    //   console.error("JSON Parse Error:", err);
    //   res.status(500).json({ error: "Invalid Python response" });
    // }
  });
};