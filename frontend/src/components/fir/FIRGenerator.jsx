import React, { useState } from "react";
import flowData from "./firFlow.json";
import { generateFir } from "../../services/api";

export default function FIRGenerator() {

  const flow = flowData.flow;

  // 🔥 MODE (future use)
  const mode = "guided";

  // EXISTING STATES
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firText, setFirText] = useState("");

  // 🔥 CHAT STATES
  const [step, setStep] = useState("start");
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([
    { sender: "bot", text: flow.start.question }
  ]);
  const [input, setInput] = useState("");

  // 🔥 HANDLE CHAT ANSWER
  const handleChatAnswer = (value) => {
    const current = flow[step];

    const updatedAnswers = {
      ...answers,
      [current.field]: value
    };

    setAnswers(updatedAnswers);

    setMessages(prev => [
      ...prev,
      { sender: "user", text: value }
    ]);

    let nextStep;

    if (typeof current.next === "object") {
      if (value === "Yes") {
        nextStep = current.next.true;
      } else {
        nextStep = current.next.false;
      }
    } else {
      nextStep = current.next;
    }

    if (nextStep === "end") {
      generateFIR(updatedAnswers);
    } else {
      setStep(nextStep);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: flow[nextStep].question }
      ]);
    }
  };

  // 🔥 GENERATE FIR
  const generateFIR = async (data) => {
    try {
      setLoading(true);
      setError("");

      const answerLabels = Object.values(flow).reduce((labels, question) => {
        labels[question.field] = question.question;
        return labels;
      }, {});
      const result = await generateFir(data, { answerLabels });

      setFirText(result.fir_text || "");

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "FIR Generated Successfully ✅" }
      ]);

    } catch (err) {
      setError(err.message || "Failed to generate FIR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">

      {/* 🔴 FUTURE MODE TOGGLE (currently not needed) */}
      {/*
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-xl text-sm ${
            mode === "manual"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Manual FIR
        </button>

        <button
          onClick={() => setMode("guided")}
          className={`px-4 py-2 rounded-xl text-sm ${
            mode === "guided"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Smart Assistant
        </button>
      </div>
      */}

      {/* 🔴 ERROR */}
      {error && (
        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {/* ========================= */}
      {/* 🔥 GUIDED MODE (ACTIVE) */}
      {/* ========================= */}

      {mode === "guided" && (
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">
            Smart FIR Assistant
          </h2>

          <div className="h-72 overflow-y-auto rounded-xl border p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {step !== "end" && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    handleChatAnswer(input);
                    setInput("");
                  }
                }}
              />

              <button
                onClick={() => {
                  if (input.trim()) {
                    handleChatAnswer(input);
                    setInput("");
                  }
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-3 text-sm text-slate-500">
              Generating FIR...
            </div>
          )}
        </div>
      )}

      {/* ========================= */}
      {/* 📝 MANUAL MODE (COMMENTED - FUTURE USE) */}
      {/* ========================= */}

      {/*
      {mode === "manual" && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-800">
            Manual FIR Input
          </h2>

          <textarea
            className="mt-3 w-full rounded-xl border p-3"
            placeholder="Write your FIR details here..."
          />

          <button className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-white">
            Generate FIR
          </button>
        </div>
      )}
      */}

      {/* 🔥 OUTPUT */}
      {firText && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-900">
            Generated FIR
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
            {firText}
          </p>
        </div>
      )}

    </div>
  );
}
