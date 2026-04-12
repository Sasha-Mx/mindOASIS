import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Star, ArrowRight } from 'lucide-react';
import HeroIllustration from '../components/HeroIllustration';
const Home = () => {
  const navigate = useNavigate();

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
      className="hero-gradient min-h-screen flex flex-col overflow-hidden"
    >
      {/* Hero Section */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 md:px-12 py-12 max-w-7xl mx-auto w-full">
        
        {/* Left: Copy */}
        <div className="flex flex-col gap-8 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/65 border border-blue-400/25 rounded-full text-xs font-bold text-blue-500 backdrop-blur-md w-fit">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-custom"></div>
            AI-powered career coaching for students
          </div>

          <h1 className="font-nunito text-5xl md:text-6xl font-black text-[var(--navy)] leading-tight tracking-tight">
            From confused<br/>student to <span className="text-blue-400 relative">placed<span className="absolute bottom-[-4px] left-0 right-0 h-1 bg-gold opacity-80 rounded-sm"></span></span><br/>professional.
          </h1>

          <p className="text-lg text-[var(--text-2)] leading-relaxed max-w-lg">
            Mentra analyzes your skills, builds a personalized roadmap, runs mock interviews, and guides you step-by-step — all powered by AI.
          </p>

          <div className="flex flex-col gap-3">
            {[
              { icon: '🎯', text: 'AI skill gap analysis vs industry standards' },
              { icon: '🗺️', text: 'Week-by-week personalized learning roadmap' },
              { icon: '🎤', text: 'Mock interview practice with instant feedback' },
              { icon: '📊', text: 'Progress tracking + application management' }
            ].map((bullet, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-medium text-[var(--text-2)]">
                <div className="w-7 h-7 bg-blue-400/12 rounded-lg flex items-center justify-center text-sm">{bullet.icon}</div>
                {bullet.text}
              </div>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap mt-4">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-[var(--navy)] text-white rounded-full font-nunito font-extrabold text-base shadow-lg shadow-navy/25 hover:translate-y-[-2px] hover:shadow-navy/35 transition-all flex items-center gap-2"
            >
              🚀 Start for free
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/70 text-[var(--navy)] border border-blue-400/30 rounded-full font-medium text-base backdrop-blur-md hover:bg-white hover:border-blue-300 transition-all flex items-center gap-2"
            >
              Log in →
            </button>
          </div>

          <div className="flex gap-8 pt-6">
            {[
              { num: '4Cr+', label: 'Students in India' },
              { num: '26%', label: 'Skill gap in hires' },
              { num: '0', label: 'Platforms solving this' }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <span className="font-nunito text-2xl font-black text-[var(--navy)]">{stat.num}</span>
                <span className="text-xs font-semibold text-[var(--text-2)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="hero-right hidden lg:flex w-full">
          <HeroIllustration />
        </div>
      </div>

      {/* Features section */}
      <section id="features" style={{ padding: '80px 48px', background: 'white' }}>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 36, fontWeight: 900, textAlign: 'center', marginBottom: 48, color: 'var(--text-1)' }}>
          Everything you need to get placed
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { icon: '🎯', title: 'AI Skill Gap Analysis', desc: 'Know exactly which skills you need and why — benchmarked against real job descriptions.' },
            { icon: '🗺️', title: 'Personalized Roadmap', desc: 'An 8-week plan built specifically for your role, skills, and timeline. Updates as you grow.' },
            { icon: '🎤', title: 'Mock Interview Practice', desc: 'AI-generated questions with instant feedback. Practice until you\'re confident.' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Confidence score, streaks, and weekly milestones keep you accountable every day.' },
            { icon: '📋', title: 'Application Tracker', desc: 'Track every application — company, status, interview rounds — in one clean dashboard.' },
            { icon: '⚡', title: 'Daily Missions', desc: '3 fresh AI-generated tasks every morning. Small wins that compound into placement.' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'var(--bg-page)', border: '1px solid var(--input-border)',
              borderRadius: 20, padding: '28px 24px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, marginBottom: 8, color: 'var(--text-1)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" style={{ padding: '80px 48px', background: 'var(--bg-page)' }}>
        <h2 style={{ fontFamily: 'Nunito', fontSize: 36, fontWeight: 900, textAlign: 'center', marginBottom: 12, color: 'var(--text-1)' }}>
          From signup to offer in 4 steps
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-2)', marginBottom: 56, fontSize: 16 }}>Takes 2 minutes to set up</p>
        <div style={{ display: 'flex', gap: 0, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          {/* Connector line */}
          <div className="hidden md:block" style={{ position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 2, background: 'var(--gradient-btn)', borderRadius: 2, zIndex: 0 }}/>
          {[
            { step: '1', icon: '✍️', title: 'Answer 5 questions', desc: 'Tell us your year, role, skills, and timeline' },
            { step: '2', icon: '🤖', title: 'AI builds your plan', desc: 'Gemini generates your personalized roadmap' },
            { step: '3', icon: '📅', title: 'Follow daily missions', desc: 'Complete 3 tasks per day to unlock new weeks' },
            { step: '4', icon: '🎉', title: 'Get placed', desc: 'Walk into interviews confident and prepared' },
          ].map(s => (
            <div key={s.step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--gradient-btn)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 16,
                boxShadow: '0 4px 16px rgba(123,108,246,0.35)'
              }}>{s.icon}</div>
              <h4 style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, marginBottom: 8, color: 'var(--text-1)' }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <button onClick={() => navigate('/signup')} style={{
            padding: '16px 40px',
            background: 'var(--gradient-btn)',
            color: 'white', border: 'none', borderRadius: 50,
            fontFamily: 'Nunito', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', boxShadow: '0 8px 28px rgba(123,108,246,0.35)'
          }}>
            Start your journey free →
          </button>
        </div>
      </section>

      {/* For colleges section */}
      <section id="colleges" style={{ padding: '80px 48px', background: 'white' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px',
            background: 'var(--bg-page)', borderRadius: 50,
            fontSize: 13, fontWeight: 700, color: 'var(--purple)',
            marginBottom: 20
          }}>For placement cells &amp; TPOs</div>
          <h2 style={{ fontFamily: 'Nunito', fontSize: 36, fontWeight: 900, marginBottom: 16, color: 'var(--text-1)' }}>
            License Mentra for your entire college
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 40 }}>
            Give every student in your college access to AI-powered placement prep. Track batch-level progress, identify struggling students early, and improve your placement statistics.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              padding: '14px 32px',
              background: 'var(--navy)', color: 'white',
              border: 'none', borderRadius: 50,
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15,
              cursor: 'pointer'
            }}>Request a demo</button>
            <button style={{
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--navy)',
              border: '1.5px solid var(--input-border)', borderRadius: 50,
              fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15,
              cursor: 'pointer'
            }}>Learn more</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12" style={{ padding: '32px 48px', background: 'var(--navy)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'Nunito', fontWeight: 900, color: 'white', fontSize: 18 }}>Mentra<span style={{ color: 'var(--blue-mid)' }}>.AI</span></span>
        <span style={{ fontSize: 13, color: '#8090c0' }}>© 2026 Mentra.AI · Built for Indian students</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: '#8090c0', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </footer>
    </motion.div>
  );
};


export default Home;
