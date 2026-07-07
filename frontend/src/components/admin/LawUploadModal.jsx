import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function LawUploadModal({ isOpen, onClose, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [actName, setActName] = useState('');
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
    if (!actName) {
        setActName(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(10);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('actName', actName || file.name.replace('.pdf', ''));
      formData.append('title', file.name);

      const token = localStorage.getItem('token');
      
      const res = await axios.post('/api/admin/upload-law', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}` 
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percentCompleted, 90)); // Save last 10% for backend processing
        }
      });
      
      setProgress(100);
      setTimeout(() => {
        onUploadComplete(res.data);
        setFile(null);
        setActName('');
        setProgress(0);
        setIsUploading(false);
      }, 500);

    } catch (err) {
      console.error("Upload failed", err);
      setError(err.response?.data?.message || 'Upload failed. Please ensure file is valid and DB is accessible.');
      setIsUploading(false);
      setProgress(0);
    }
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
        
        <div className="p-6 space-y-4">
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
              <p className="text-sm font-medium text-gray-700 mb-1">Tap here to select document or take photo</p>
              <p className="text-xs text-gray-500">Maximum file size 50MB</p>
              {error && <p className="text-xs text-red-500 mt-2 font-medium flex items-center justify-center gap-1"><AlertCircle size={12}/>{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-500 rounded-lg">
                    <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    {!isUploading && (
                    <button 
                        onClick={() => { setFile(null); setError(''); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                    )}
                </div>
                
                {isUploading && (
                    <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-blue-600">{progress < 90 ? 'Uploading...' : 'Indexing with AI...'}</span>
                        <span className="text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                        />
                    </div>
                    </div>
                )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Act Name (for AI Indexing)</label>
                    <input 
                        type="text" 
                        value={actName}
                        onChange={(e) => setActName(e.target.value)}
                        disabled={isUploading}
                        placeholder="e.g. The Indian Penal Code, 1860"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50"
                    />
                </div>
                {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose} 
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading || !actName}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 flex items-center gap-2"
          >
            {isUploading ? 'Processing...' : 'Upload & Index'}
          </button>
        </div>
      </div>
    </div>
  );
}
