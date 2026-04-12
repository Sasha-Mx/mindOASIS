import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { 
  Home, Map, Zap, MessageSquare, Briefcase, Settings as SettingsIcon, 
  ChevronLeft, ChevronRight, LogOut, Target, FileText, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  };

  const links = [
    { icon: <Home size={20} />, label: 'Dashboard',    path: '/dashboard' },
    { icon: <Map size={20} />, label: 'Roadmap',      path: '/roadmap' },
    { icon: <Target size={20} />, label: 'Job Market Intel', isNew: true, path: '/market' },
    { icon: <Zap size={20} />, label: 'Daily Missions', path: '/missions' },
    { icon: <MessageSquare size={20} />, label: 'Mock Interview', path: '/interview' },
    { icon: <ClipboardList size={20} />, label: 'Application Tracker',  path: '/applications' },
    { icon: <FileText size={20} />, label: 'Resume Reviewer', path: '/resume', isTry: true },
    { icon: <SettingsIcon size={20} />, label: 'Settings',      path: '/settings' },
  ];

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase()
    : 'U';
    
  const displayName = user?.firstName || 'User';

  return (
    <div className={`transition-all duration-300 ease-in-out flex flex-col sticky top-0 h-screen border-r border-[#1a1d2e] bg-[#0F111A] ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} shrink-0 z-50`}>
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#1a1d2e] border border-[#2d314d] rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-[#7f77dd] shadow-sm transition-all z-[60]"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={`p-8 mb-4 overflow-hidden whitespace-nowrap transition-all ${isCollapsed ? 'px-6' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7b6cf6] rounded-xl flex items-center justify-center shrink-0">
             <Star className="text-white" fill="currentColor" size={20} />
          </div>
          {!isCollapsed && (
            <span className="font-black text-xl text-white tracking-tight">
              Mentra<span className="text-[#7b6cf6]">.AI</span>
            </span>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-x-hidden">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center group relative p-3.5 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className={`shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {link.icon}
              </div>
              
              {!isCollapsed && (
                <div className={`ml-3 font-bold text-sm whitespace-nowrap transition-opacity duration-200 flex items-center gap-2 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  <span>{link.label}</span>
                  {link.isNew && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white shadow-sm inline-block">
                      New
                    </span>
                  )}
                  {link.isTry && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-sm inline-block">
                      Try
                    </span>
                  )}
                </div>
              )}

              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                />
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] border border-slate-700">
                   {link.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center gap-3 p-2 rounded-2xl mb-4 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] flex items-center justify-center shrink-0 text-white font-black text-xs border border-white/10">
              {initials}
           </div>
           {!isCollapsed && (
             <div className="flex-1 overflow-hidden">
                <p className="text-white font-bold text-sm truncate">{displayName}</p>
                <p className="text-slate-500 text-[11px] font-medium truncate">{user?.email}</p>
             </div>
           )}
        </div>
        
        <button 
          onClick={() => { logout(); navigate('/'); }}
          className={`w-full flex items-center justify-center gap-3 p-3 rounded-2xl bg-rose-500/10 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-all ${isCollapsed ? 'px-0' : ''}`}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

// Internal Star component since it wasn't imported from lucide
function Star({ className, fill, size }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
