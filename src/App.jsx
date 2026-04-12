import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, UserProvider } from './context/UserContext';
import { AnimatePresence } from 'framer-motion';

import Home      from './pages/Home';
import Login       from './pages/Login';
import Signup      from './pages/Signup';
import Onboarding  from './pages/Onboarding';
import Dashboard   from './pages/Dashboard';
import Roadmap     from './pages/Roadmap';
import Interview   from './pages/Interview';
import Applications from './pages/Applications';
import MarketIntelligencePage from './pages/MarketIntelligencePage';
import Missions    from './pages/Missions';
import Settings    from './pages/Settings';
import Resume      from './pages/Resume';
import Navbar      from './components/Navbar';
import LoadingScreen   from './components/LoadingScreen';

function SmartRoute({ children, requireAuth, requireOnboarding, guestOnly }) {
  const { user, loadingAuth } = useUser();

  if (loadingAuth) return <LoadingScreen />;

  const isUserOnboarded = user?.onboardingDone || !!user?.roadmap;

  // Guest-only pages (splash, login, signup)
  // If already logged in + onboarded → send to dashboard
  if (guestOnly && user && isUserOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }
  // If logged in but not onboarded → send to onboarding
  if (guestOnly && user && !isUserOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Auth required pages
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding required pages (dashboard and beyond)
  if (requireOnboarding && user && !isUserOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding page itself — we let the page handle its own state/redirection
  // to avoid skipping the celebration transition.
  /* 
  if (requireAuth && !requireOnboarding && user && user.onboardingDone) {
    return <Navigate to="/dashboard" replace />;
  }
  */

  return children;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-1)] font-dm-sans selection:bg-blue-400/30">
          <AnimatePresence mode="wait">
            <Routes>
            {/* Guest only (Splash, Login, Signup) */}
            <Route path="/" element={
              <SmartRoute guestOnly><Navbar /><Home /></SmartRoute>
            }/>
            <Route path="/login" element={
              <SmartRoute guestOnly><Login /></SmartRoute>
            }/>
            <Route path="/signup" element={
              <SmartRoute guestOnly><Signup /></SmartRoute>
            }/>

            {/* Auth required, onboarding NOT yet done */}
            <Route path="/onboarding" element={
              <SmartRoute requireAuth><Onboarding /></SmartRoute>
            }/>

            {/* Auth + onboarding required (Navbbar intentionally disconnected from dashboard) */}
            <Route path="/dashboard" element={
              <SmartRoute requireAuth requireOnboarding><Dashboard /></SmartRoute>
            }/>
            <Route path="/missions" element={
              <SmartRoute requireAuth requireOnboarding><Missions /></SmartRoute>
            }/>
            <Route path="/roadmap" element={
              <SmartRoute requireAuth requireOnboarding><Roadmap /></SmartRoute>
            }/>
            <Route path="/interview" element={
              <SmartRoute requireAuth requireOnboarding><Interview /></SmartRoute>
            }/>
            <Route path="/applications" element={
              <SmartRoute requireAuth requireOnboarding><Applications /></SmartRoute>
            }/>
            <Route path="/market" element={
              <SmartRoute requireAuth requireOnboarding><MarketIntelligencePage /></SmartRoute>
            }/>
            <Route path="/resume" element={
              <SmartRoute requireAuth requireOnboarding><Resume /></SmartRoute>
            }/>
            <Route path="/settings" element={
              <SmartRoute requireAuth requireOnboarding><Settings /></SmartRoute>
            }/>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />}/>
          </Routes>
        </AnimatePresence>
      </div>
      </BrowserRouter>
    </UserProvider>
  );
}
