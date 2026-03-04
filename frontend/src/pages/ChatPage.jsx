import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowUp, FileText, Loader2, X, Sparkles, User, AlertCircle, CheckCircle } from 'lucide-react';
import { analyzeDocument, analyzeText } from '../services/api';
import { formatAnalysisResponse } from '../utils/formatAnalysis';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CHATPAGE COMPONENT - Main Document Analysis Interface
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Purpose: User interface for uploading documents and viewing AI analysis
 * Features:
 *   - File upload (PDF/Images)
 *   - Text-only analysis
 *   - Chat-style conversation display
 *   - Error handling with user feedback
 *   - Progress indicators
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export default function ChatPage() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  
  // Refs for DOM manipulation
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if AI has responded (for showing "New Analysis" button)
  const hasAIResponded = chatHistory.some(msg => msg.role === 'ai');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCROLL TO BOTTOM ON NEW MESSAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILE HANDLING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (15MB limit)
      const maxSize = 15 * 1024 * 1024; // 15MB in bytes
      if (selectedFile.size > maxSize) {
        addErrorMessage("File size exceeds 15MB limit. Please upload a smaller file.");
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp"
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        addErrorMessage("Invalid file type. Please upload a PDF or image file (PNG, JPEG, JPG, GIF, WEBP).");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAT MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const resetChat = () => {
    setChatHistory([]);
    setFile(null);
    setInputText("");
    setAnalysisProgress(null);
  };

  const addUserMessage = (content, hasFile = false) => {
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content, 
      hasFile,
      timestamp: new Date().toISOString()
    }]);
  };

  const addAIMessage = (content, isError = false) => {
    setChatHistory(prev => [...prev, { 
      role: 'ai', 
      content, 
      isError,
      timestamp: new Date().toISOString()
    }]);
  };

  const addErrorMessage = (message) => {
    addAIMessage(`❌ ${message}`, true);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN ANALYSIS HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSend = async () => {
    // Validate input: must have either file or text
    if (!file && !inputText.trim()) {
      return;
    }

    // Build user message content
    const userMessageParts = [];
    if (file) {
      userMessageParts.push(`📄 Uploaded: ${file.name}`);
      userMessageParts.push(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
      userMessageParts.push(`   Type: ${file.type}`);
    }
    if (inputText.trim()) {
      userMessageParts.push("\n" + inputText.trim());
    }
    
    // Add user message to chat
    addUserMessage(userMessageParts.join('\n'), !!file);
    
    // Store current values and clear inputs
    const currentFile = file;
    const currentText = inputText;
    setInputText("");
    removeFile();
    
    // Start loading
    setLoading(true);
    setAnalysisProgress("Preparing document...");

    try {
      let response;
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CASE 1: File Upload Analysis
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (currentFile) {
        setAnalysisProgress("Uploading document...");
        
        // Call API with progress callback
        response = await analyzeDocument(currentFile, (progress) => {
          if (progress.stage === "uploading") {
            setAnalysisProgress("Uploading and extracting text...");
          } else if (progress.stage === "analyzing") {
            setAnalysisProgress("Analyzing with AI...");
          } else if (progress.stage === "completed") {
            setAnalysisProgress("Finalizing results...");
          }
        });
      } 
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CASE 2: Text-Only Analysis
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      else if (currentText.trim()) {
        setAnalysisProgress("Analyzing text...");
        response = await analyzeText(currentText);
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // FORMAT AND DISPLAY RESULTS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const formattedResponse = formatAnalysisResponse(response);
      addAIMessage(formattedResponse);
      
    } catch (error) {
      console.error("[ChatPage] Analysis error:", error);
      
      // Display user-friendly error message
      addErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      
    } finally {
      // Clean up loading state
      setLoading(false);
      setAnalysisProgress(null);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <main className="flex-1 flex flex-col relative bg-brand-base text-brand-primary h-full overflow-hidden">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* MESSAGES AREA */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 overflow-y-auto p-4 w-full flex flex-col items-center">
        
        {/* Empty State - Show when no messages */}
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mt-10">
            <div className="mb-6">
              <Sparkles size={48} className="text-brand-accent mx-auto mb-4" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4 text-brand-primary">
              Your AI Shield Against Legal Fraud
            </h1>
            <p className="text-lg md:text-xl opacity-80 font-medium px-4 mb-8">
              Instantly analyze agreements, detect hidden risks, and understand complex clauses in plain language.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-xl">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-surface">
                <CheckCircle size={24} className="text-green-500 mb-2" />
                <h3 className="font-semibold mb-1">Privacy Protected</h3>
                <p className="text-sm opacity-70">Sensitive data is masked before analysis</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-surface">
                <Sparkles size={24} className="text-brand-accent mb-2" />
                <h3 className="font-semibold mb-1">AI-Powered</h3>
                <p className="text-sm opacity-70">Advanced Gemini AI for risk detection</p>
              </div>
            </div>
          </div>
        ) : (
          /* Message History - Show chat messages */
          <div className="w-full max-w-3xl flex flex-col gap-6 pb-8">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* AI Avatar */}
                {msg.role === 'ai' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-brand-base shrink-0 mt-1 ${
                    msg.isError ? 'bg-red-500' : 'bg-brand-accent'
                  }`}>
                    {msg.isError ? <AlertCircle size={16} /> : <Sparkles size={16} />}
                  </div>
                )}

                {/* Message Content */}
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-surface text-brand-primary rounded-tr-sm' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-sm'
                      : 'bg-white shadow-sm border border-brand-surface rounded-tl-sm'
                }`}>
                  {msg.hasFile && <FileText size={18} className="inline-block mr-2 mb-1 opacity-70" />}
                  {/* Render message with proper formatting (supports markdown-style) */}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-base shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-base shrink-0 mt-1">
                  <Sparkles size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white shadow-sm border border-brand-surface rounded-tl-sm flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-brand-accent" />
                    <span className="text-sm opacity-70 italic">{analysisProgress || "Processing..."}</span>
                  </div>
                  <div className="text-xs opacity-50">
                    This may take a few moments for large documents
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* INPUT AREA */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full flex justify-center p-4 bg-gradient-to-t from-brand-base via-brand-base to-transparent">
        <div className="w-full max-w-3xl">
          
          {/* Show "New Analysis" button after AI responds */}
          {hasAIResponded ? (
            <div className="flex justify-center py-2 transition-all">
              <button 
                onClick={resetChat}
                className="flex items-center gap-2 bg-brand-primary text-brand-base px-6 py-3 rounded-full font-bold text-lg hover:bg-brand-accent transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <Sparkles size={20} />
                Start New Analysis
              </button>
            </div>
          ) : (
            /* Input Box - Show when no AI response yet */
            <div className="bg-white rounded-2xl shadow-lg border border-brand-surface p-2 flex flex-col focus-within:ring-2 focus-within:ring-brand-accent transition-all">
              
              {/* Text Input Area */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={file ? "Add instructions about this document (optional)..." : "Ask a question or paste legal text here..."}
                disabled={loading}
                className={`w-full resize-none bg-transparent p-3 outline-none min-h-[60px] max-h-[200px] text-brand-primary transition-opacity ${
                  loading ? "opacity-50 cursor-not-allowed" : "placeholder:text-brand-primary/50"
                }`}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              ></textarea>
              
              {/* File Preview */}
              {file && (
                <div className="px-3 py-2 flex items-center justify-between gap-2 text-sm text-brand-accent font-medium bg-brand-base mx-2 rounded-md border border-brand-surface/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs opacity-70">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <button 
                    onClick={removeFile}
                    disabled={loading}
                    className="p-1 hover:bg-brand-surface rounded-full transition text-brand-primary disabled:opacity-50"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-2 px-2 pb-1">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                {/* Upload Button */}
                <button 
                  onClick={handleUploadClick}
                  disabled={loading}
                  title="Upload PDF or image document"
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition ${
                    loading ? "opacity-50 cursor-not-allowed text-brand-primary" : "text-brand-primary hover:bg-brand-base"
                  }`}
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload Document</span>
                </button>

                {/* Send Button */}
                <button 
                  onClick={handleSend}
                  disabled={(!file && !inputText.trim()) || loading}
                  title={file || inputText.trim() ? "Analyze document" : "Please upload a file or enter text"}
                  className={`p-2 rounded-full transition flex items-center justify-center ${
                    (!file && !inputText.trim()) || loading 
                      ? 'bg-brand-surface cursor-not-allowed text-brand-primary/50' 
                      : 'bg-brand-primary text-brand-base hover:bg-brand-accent hover:scale-110'
                  }`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-brand-primary/60 mt-4">
            Nyay Sahayak uses AI analysis. Always verify critical information with a legal professional.
          </p>
        </div>
      </div>
    </main>
  );
}