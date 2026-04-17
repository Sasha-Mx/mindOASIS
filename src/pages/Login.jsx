import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Spinner } from '../components/LoadingUI';
import { Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AuthIllustration from '../components/AuthIllustration';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      
      // Smart redirect — if onboarding not done, go there first
      navigate(res.data.user.profile ? '/dashboard' : '/onboarding');
    } catch (err) {
      console.error("Login failed", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-left font-dm-sans text-[var(--text-1)] overflow-hidden"
    >
      
      {/* Back button */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 border border-[var(--input-border)] rounded-full text-sm font-semibold text-[var(--text-2)] bg-white hover:border-[var(--blue-mid)] transition-all z-20 shadow-sm">
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Left Panel: Brand Illustration */}
      <div className="hidden lg:block auth-left h-[100vh] sticky top-0 p-0 overflow-hidden">
        <AuthIllustration />
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-white overflow-y-auto h-[100vh]">
        <div className="w-full max-w-[400px] h-full flex flex-col justify-center">
          <div className="font-nunito text-lg font-black text-[var(--text-1)] mb-8">Mentra<span className="text-[var(--blue-primary)]">.AI</span></div>
          <h1 className="font-nunito text-3xl font-black text-[var(--text-1)] mb-1">Welcome back 👋</h1>
          <p className="text-sm text-[var(--text-3)] mb-8">Log in to continue your career journey</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-red-500 text-sm font-semibold mb-2">{error}</div>}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[var(--text-2)]">Email address</label>
              <div className="flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 h-12 focus-within:border-[var(--blue-primary)] focus-within:ring-4 focus-within:ring-[var(--blue-light)] transition-all">
                <Mail size={16} className="text-[var(--text-3)]" />
                <input 
                  type="email" 
                  placeholder="you@college.edu" 
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="h-[1px] flex-1 bg-[var(--input-border)]"></div>
              <span className="text-xs text-[var(--text-3)] font-semibold">or</span>
              <div className="h-[1px] flex-1 bg-[var(--input-border)]"></div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[var(--text-2)]">Phone number</label>
              <div className="flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 h-12">
                <Phone size={16} className="text-[var(--text-3)]" />
                <input type="tel" placeholder="+91 98765 43210" className="flex-1 bg-transparent border-none outline-none text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[var(--text-2)]">Password</label>
              <div className="flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 h-12 focus-within:border-[var(--blue-primary)] transition-all">
                <Lock size={16} className="text-[var(--text-3)]" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-3)] hover:text-[var(--navy)] transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 text-[13px] text-[var(--text-2)] cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--blue-light)] text-[var(--blue-primary)] focus:ring-[var(--blue-primary)]" />
                Remember me
              </label>
              <a href="#" className="text-[13px] text-[var(--text-2)] font-bold hover:text-[var(--blue-primary)] transition-colors">Forgot password?</a>
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 text-white rounded-full font-nunito font-extrabold text-base shadow-[0_4px_24px_rgba(74,127,224,0.30)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(74,127,224,0.40)] transition-all disabled:opacity-70 disabled:hover:translate-y-0" style={{ background: 'var(--gradient-btn)' }}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--input-border)]"></div></div>
            <span className="relative bg-white px-4 text-xs text-[var(--text-3)]">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button 
              type="button"
              onClick={() => alert('Google Sign-In coming soon! Please use email for now.')}
              className="flex items-center justify-center gap-2 py-3 border border-[var(--input-border)] rounded-xl text-sm font-semibold text-[var(--text-2)] hover:border-[var(--blue-mid)] hover:translate-y-[-1px] transition-all bg-white shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 border border-[var(--input-border)] rounded-xl text-sm font-semibold text-[var(--text-2)] hover:border-[var(--blue-mid)] hover:translate-y-[-1px] transition-all bg-white shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </button>
          </div>

          <div className="text-center text-[13px] text-[var(--text-3)]">
            Don't have an account? <Link to="/signup" className="text-[var(--blue-primary)] font-bold hover:underline">Sign up free</Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
