import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowUp, FileText, Loader2, X, Sparkles, User } from 'lucide-react';

export default function ChatPage() {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const hasAIResponded = chatHistory.some(msg => msg.role === 'ai');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const resetChat = () => {
    setChatHistory([]);
    setFile(null);
    setInputText("");
  };

  const handleSend = async () => {
    if (!file && !inputText.trim()) return;

    // Combine both the file name (if exists) and the typed text into one message
    const userMessageParts = [];
    if (file) userMessageParts.push(`Uploaded Document: ${file.name}`);
    if (inputText.trim()) userMessageParts.push(inputText.trim());
    
    setChatHistory([{ role: 'user', content: userMessageParts.join('\n\n'), hasFile: !!file }]);
    
    setLoading(true);
    
    const currentFile = file;
    const currentText = inputText;
    
    setInputText("");
    removeFile(); 

    try {
      if (currentFile) {
        const formData = new FormData();
        formData.append("document", currentFile);
        // If the user also typed a prompt, we can send it to the backend too
        if (currentText.trim()) {
          formData.append("prompt", currentText.trim());
        }

        const response = await fetch("http://localhost:5000/api/document/upload", {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json();
        
        if(data.success) {
          setChatHistory(prev => [...prev, { role: 'ai', content: data.data.extractedText }]);
        } else {
          setChatHistory(prev => [...prev, { role: 'ai', content: "Error: " + data.message, isError: true }]);
        }
      } else if (currentText) {
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            content: "I received your text! In the next phase, I will analyze this using the Gemini API." 
          }]);
          setLoading(false);
        }, 1000);
        return; 
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Error connecting to the server. Is your backend running?", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative bg-brand-base text-brand-primary h-full overflow-hidden">
      
      <div className="flex-1 overflow-y-auto p-4 w-full flex flex-col items-center">
        
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mt-10">
            <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4 text-brand-primary">
              Your AI Shield Against Legal Fraud.
            </h1>
            <p className="text-lg md:text-xl opacity-80 font-medium px-4">
              Instantly analyze agreements, detect hidden risks, and understand complex clauses in plain language.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-6 pb-8">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-base shrink-0 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className={`p-4 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-brand-surface text-brand-primary rounded-tr-sm' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-sm'
                      : 'bg-white shadow-sm border border-brand-surface rounded-tl-sm'
                }`}>
                  {msg.hasFile && <FileText size={18} className="inline-block mr-2 mb-1 opacity-70" />}
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-base shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-base shrink-0 mt-1">
                  <Sparkles size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white shadow-sm border border-brand-surface rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-brand-accent" />
                  <span className="text-sm opacity-70 italic">Analyzing document...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="w-full flex justify-center p-4 bg-gradient-to-t from-brand-base via-brand-base to-transparent">
        <div className="w-full max-w-3xl">
          
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
            <div className="bg-white rounded-2xl shadow-lg border border-brand-surface p-2 flex flex-col focus-within:ring-2 focus-within:ring-brand-accent transition-all">
              
              {/* REMOVED disabled={!!file} - users can now type freely! */}
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
              
              {file && (
                <div className="px-3 py-2 flex items-center justify-between gap-2 text-sm text-brand-accent font-medium bg-brand-base mx-2 rounded-md border border-brand-surface/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button 
                    onClick={removeFile}
                    disabled={loading}
                    className="p-1 hover:bg-brand-surface rounded-full transition text-brand-primary disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center mt-2 px-2 pb-1">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <button 
                  onClick={handleUploadClick}
                  disabled={loading}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition ${
                    loading ? "opacity-50 cursor-not-allowed text-brand-primary" : "text-brand-primary hover:bg-brand-base"
                  }`}
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">Upload Legal Document</span>
                </button>

                <button 
                  onClick={handleSend}
                  disabled={(!file && !inputText.trim()) || loading}
                  className={`p-2 rounded-full transition flex items-center justify-center ${
                    (!file && !inputText.trim()) || loading ? 'bg-brand-surface cursor-not-allowed text-brand-primary/50' : 'bg-brand-primary text-brand-base hover:bg-brand-accent'
                  }`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-brand-primary/60 mt-4">
            Nyay Sahayak can make mistakes. Always verify critical information with a legal professional.
          </p>
        </div>
      </div>
    </main>
  );
}