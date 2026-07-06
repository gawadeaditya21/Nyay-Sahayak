import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

export default function LawUploadModal({ isOpen, onClose, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError('');
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are supported for laws.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    
    // Simulate upload and indexing progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setTimeout(() => {
            onUploadComplete({ id: Date.now(), title: file.name, status: 'indexed', date: new Date().toISOString() });
            setFile(null);
            setProgress(0);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">Upload Law Document</h3>
          <button onClick={() => !isUploading && onClose()} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
              />
              <UploadCloud size={40} className={`mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700 mb-1">Click or drag PDF file here</p>
              <p className="text-xs text-gray-500">Maximum file size 50MB</p>
              {error && <p className="text-xs text-red-500 mt-2 font-medium flex items-center justify-center gap-1"><AlertCircle size={12}/>{error}</p>}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-500 rounded-lg">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isUploading && (
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{progress < 100 ? 'Uploading and indexing...' : 'Complete!'}</span>
                    <span className="text-blue-600 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 flex items-center gap-2 transition-all"
          >
            {isUploading ? 'Processing...' : 'Upload & Index'}
          </button>
        </div>
      </div>
    </div>
  );
}
