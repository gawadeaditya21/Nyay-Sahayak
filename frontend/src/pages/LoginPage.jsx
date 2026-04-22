import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  // State for form inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isRegister ? '/signup' : '/login';
    const url = `http://localhost:5000/api/auth${endpoint}`;

    try {
      const res = await axios.post(url, formData);

      if (!isRegister) {
        // LOGIN LOGIC: Save token and user details
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/chat'); // Go back to assistant/dashboard
      } else {
        // SIGNUP LOGIC: Switch to login mode
        setIsRegister(false);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full point-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="flex justify-center mb-10">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)]">
            <Scale size={32} className="text-white" />
          </div>
        </div>

        <div className="bg-[#121215]/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isRegister ? "Create specific account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isRegister ? "Sign up to track your legal analysis history." : "Log in to view your past document scans."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      name="name"
                      type="text" 
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe" 
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0a0a0c] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  name="email"
                  type="email" 
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0a0a0c] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  name="password"
                  type="password" 
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0a0a0c] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Processing..." : (isRegister ? "Sign Up" : "Sign In")}
              {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }} 
                className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors ml-1"
              >
                {isRegister ? "Log In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

      </motion.div>
    </div>
  );
}