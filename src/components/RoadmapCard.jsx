import React, { useState } from 'react';
import { Lock, CheckCircle2, ChevronDown, ChevronUp, Youtube, FileText, BookOpen, Code2, Award, Sparkles, ExternalLink } from 'lucide-react';
import { useUser } from '../context/UserContext';

const resourceIcons = {
  youtube_playlist: { icon: Youtube, color: 'text-red-500', bg: 'bg-red-50', label: '📺 Video' },
  worksheet: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: '📄 Article' },
  docs: { icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50', label: '📚 Docs' },
  practice: { icon: Code2, color: 'text-amber-500', bg: 'bg-amber-50', label: '🏋️ Practice' },
  cheatsheet: { icon: Award, color: 'text-purple-500', bg: 'bg-purple-50', label: '📋 Cheat Sheet' },
};

const RoadmapCard = ({ week, focus, tasks, resources, project, isUnlocked, isCurrent, isCompleted, onTaskComplete, onQuizStart }) => {
  const [isOpen, setIsOpen] = useState(isCurrent || isCompleted);
  const { user } = useUser();

  const getStatusColor = () => {
    if (isCompleted) return { circle: 'bg-[#E1F5EE]', text: 'text-[#085041]', border: 'border-[#1D9E7520]', accent: '#1D9E75' };
    if (isCurrent) return { circle: 'bg-[#F0EDFF]', text: 'text-[#3C3489]', border: 'border-[#7F77DD40]', accent: '#7F77DD' };
    return { circle: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', accent: '#94a3b8' };
  };

  const styles = getStatusColor();

  // Group resources by type, ignoring ones that AI failed to provide a valid link for
  const validResources = (resources || []).filter(r => {
    const rUrl = r.url || r.link;
    return rUrl && (
      rUrl.startsWith('http://') || 
      rUrl.startsWith('https://') || 
      rUrl.startsWith('www.') || 
      rUrl.startsWith('youtube.com') || 
      rUrl.startsWith('youtu.be')
    );
  });

  const groupedResources = validResources.reduce((acc, r) => {
    const type = r.type || 'docs';
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  // Forcefully inject the deep dive link to replace broken AI ones
  if (!groupedResources['youtube_playlist']) {
    groupedResources['youtube_playlist'] = [];
  }
  
  // Replace the broken event loop video with the deep dive
  const hasSpecificVideo = groupedResources['youtube_playlist'].some(v => v.title.toLowerCase().includes('event loop') || v.title.toLowerCase().includes('understanding node'));
  
  if (hasSpecificVideo) {
    groupedResources['youtube_playlist'] = groupedResources['youtube_playlist'].filter(v => !(v.title.toLowerCase().includes('event loop') || v.title.toLowerCase().includes('understanding node')));
  }

  // Always add the Deep Dive replacement
  groupedResources['youtube_playlist'].push({
    title: 'Full deep dive into the course',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(focus + ' full deep dive')}`,
    type: 'youtube_playlist'
  });

  return (
    <div className="relative pl-12 pb-12 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-slate-100 -z-10" />
      
      {/* Week Circle Indicator */}
      <div 
        className={`absolute left-0 top-0 w-12 h-12 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
          isCompleted ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]' : 
          isCurrent ? 'bg-[#F0EDFF] border-[#7F77DD] text-[#7F77DD] shadow-lg shadow-[#7F77DD20]' : 
          'bg-white border-slate-200 text-slate-400'
        }`}
      >
        {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-black text-lg">{week}</span>}
      </div>

      <div 
        className={`bg-white rounded-3xl border transition-all overflow-hidden ${styles.border} ${isCurrent ? 'shadow-xl shadow-[#7F77DD10]' : 'shadow-sm'}`}
      >
        <div 
          className="p-6 cursor-pointer flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text} opacity-60`}>Week {week}</span>
              {isCompleted && <span className="bg-[#E1F5EE] text-[#1D9E75] text-[9px] font-black px-2 py-0.5 rounded uppercase">Done</span>}
              {isCurrent && <span className="bg-[#F0EDFF] text-[#7F77DD] text-[9px] font-black px-2 py-0.5 rounded uppercase">Current</span>}
            </div>
            <h3 className={`text-xl font-bold ${isUnlocked ? 'text-slate-900' : 'text-slate-400'}`}>{focus}</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {!isUnlocked && <Lock size={18} className="text-slate-300" />}
            {isUnlocked && (isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />)}
          </div>
        </div>

        {isOpen && isUnlocked && (
          <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="h-px bg-slate-50 w-full mb-6" />
            
            {/* Tasks with Quiz Button */}
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">📝 Tasks to Complete</h4>
            <ul className="space-y-3 mb-8">
              {tasks.map((task, idx) => {
                const taskText = typeof task === 'string' ? task : (task.title || task.task || task.text || task.name || '');
                const isTaskDone = !!task.completed;
                const quizScore = task.quizScore;
                return (
                  <li key={idx} className="flex gap-3 items-start group">
                    <button
                      onClick={() => {
                        if (!isTaskDone && onQuizStart) {
                          onQuizStart(idx, taskText);
                        }
                      }}
                      disabled={isTaskDone}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isTaskDone 
                          ? 'bg-[#1D9E75] border-[#1D9E75] text-white cursor-default' 
                          : 'border-slate-300 hover:border-[#7F77DD] hover:bg-[#F0EDFF] cursor-pointer'
                      }`}
                    >
                      {isTaskDone && <CheckCircle2 size={12} strokeWidth={4} />}
                    </button>
                    <div className="flex-1">
                      <span className={`text-[15px] font-medium leading-tight select-none transition-all ${
                        isTaskDone ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-900'
                      }`}>
                        {taskText}
                      </span>
                      {isTaskDone && quizScore !== undefined && (
                        <span className="ml-2 text-[10px] font-black bg-[#E1F5EE] text-[#1D9E75] px-2 py-0.5 rounded">
                          Quiz: {quizScore}/5
                        </span>
                      )}
                      {!isTaskDone && (
                        <button
                          onClick={() => onQuizStart && onQuizStart(idx, taskText)}
                          className="ml-2 text-[10px] font-black bg-[#F0EDFF] text-[#7F77DD] px-2.5 py-1 rounded hover:bg-[#7F77DD] hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          <Sparkles size={10} /> Take Quiz to Complete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {project && (
              <div className="bg-gradient-to-r from-[#F0EDFF] to-[#E8E4FF] rounded-2xl p-5 mb-6 border border-[#7F77DD20]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#7F77DD] mb-2">🚀 Week Project</div>
                <p className="text-[#3C3489] font-bold text-sm">{project}</p>
              </div>
            )}

            {/* Resources Section with Categorization & Dynamic Links */}
            <div className="mt-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <BookOpen size={12} /> Curated Resources
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focus + ' full course masterclass')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-100 hover:border-red-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Youtube size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-red-600 transition-colors">Video Masterclass</p>
                    <p className="text-[11px] text-slate-500 font-bold">Watch deep-dive on YT</p>
                  </div>
                </a>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focus + ' crash course')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-100 hover:border-red-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Youtube size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-red-600 transition-colors">Quick Crash Course</p>
                    <p className="text-[11px] text-slate-500 font-bold">Learn fundamentals fast</p>
                  </div>
                </a>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focus + ' project tutorial step by step')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-100 hover:border-red-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Youtube size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-red-600 transition-colors">Project Tutorial</p>
                    <p className="text-[11px] text-slate-500 font-bold">Build a real-world app</p>
                  </div>
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(focus + ' official documentation tutorial')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <FileText size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">Official Docs & Guides</p>
                    <p className="text-[11px] text-slate-500 font-bold">Read the documentation</p>
                  </div>
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(focus + ' interactive practice exercises')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Code2 size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-emerald-600 transition-colors">Hands-on Practice</p>
                    <p className="text-[11px] text-slate-500 font-bold">Interactive exercises</p>
                  </div>
                </a>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focus + ' interview questions')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Award size={18} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 truncate group-hover:text-purple-600 transition-colors">Interview Prep</p>
                    <p className="text-[11px] text-slate-500 font-bold">Common questions</p>
                  </div>
                </a>
              </div>

              {Object.keys(groupedResources).length > 0 && (
                <div className="space-y-6 pt-5 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Specific Materials for this Week</div>
                  {Object.entries(groupedResources).map(([type, items]) => {
                    const config = resourceIcons[type] || resourceIcons.docs;
                    const Icon = config.icon;
                    return (
                      <div key={type} className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.color} text-[10px] font-black uppercase tracking-wider mb-3`}>
                           <Icon size={12} /> {config.label}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.map((r, idx) => {
                            const rUrl = r.url || r.link;
                            let finalUrl = rUrl;
                            if (!finalUrl.startsWith('http')) {
                              finalUrl = 'https://' + finalUrl;
                            }
                            return (
                              <a
                                key={idx}
                                href={finalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#7F77DD80] hover:bg-white hover:shadow-md transition-all group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate group-hover:text-[#7F77DD] transition-colors">{r.title}</p>
                                </div>
                                <ExternalLink size={14} className="text-slate-300 group-hover:text-[#7F77DD] shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapCard;
