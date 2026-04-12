import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-12 py-6 relative z-50 bg-[#F0F5FF]">
      <Link to="/" className="font-nunito text-2xl font-black tracking-tight" style={{ color: '#1A1D2E' }}>
        Mentra<span style={{ color: '#4A7FE0' }}>.Al</span>
      </Link>
      
      {/* Navigation links and actions */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm font-semibold text-[#4A5480] hover:text-[#1A1D2E] transition-colors cursor-pointer">Features</a>
        <a href="#how-it-works" className="text-sm font-semibold text-[#4A5480] hover:text-[#1A1D2E] transition-colors cursor-pointer">How it works</a>
        <a href="#colleges" className="text-sm font-semibold text-[#4A5480] hover:text-[#1A1D2E] transition-colors cursor-pointer">For colleges</a>
        
        <div className="flex items-center gap-6 ml-4">
          <Link to="/login" className="text-sm font-bold text-[#4A7FE0] hover:text-[#2D5BBF] transition-colors">Log in</Link>
          <Link to="/signup" className="px-5 py-2.5 bg-[#1A1D2E] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#252840] hover:shadow-lg transition-all border border-[#1A1D2E]">
            Get Started Free →
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
