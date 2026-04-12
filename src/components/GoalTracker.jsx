import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

const GoalTracker = ({ initialGoals = [], onUpdate }) => {
  const { user, setUser } = useUser();
  const [goals, setGoals] = useState(initialGoals || user?.goals || []);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user?.goals && user.goals.length !== goals.length) {
      setGoals(user.goals);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.goals]);

  React.useEffect(() => {
    const seedGoals = async () => {
      if (!goals || goals.length === 0) {
        const mockGoals = [
          { text: "Complete DSA sheet — 150 problems", priority: "High", deadline: new Date(Date.now() + 20*24*60*60*1000), progress: 45 },
          { text: "Build 2 full-stack projects for portfolio", priority: "High", deadline: new Date(Date.now() + 35*24*60*60*1000), progress: 30 },
          { text: "Get internship at a product company", priority: "High", deadline: new Date(Date.now() + 60*24*60*60*1000), progress: 15 },
          { text: "Master System Design basics", priority: "Medium", deadline: new Date(Date.now() + 40*24*60*60*1000), progress: 20 },
          { text: "Complete Mock Interview practice — 10 sessions", priority: "Medium", deadline: new Date(Date.now() + 30*24*60*60*1000), progress: 10 }
        ];
        try {
          await Promise.all(mockGoals.map(g => api.post('/users/goals', g)));
          // fetch updated user context
          const res = await api.get('/profile/me');
          if (res.data?.goals) {
             setGoals(res.data.goals);
             if (onUpdate) onUpdate(res.data.goals);
             setUser(prev => ({ ...prev, goals: res.data.goals }));
          }
        } catch (e) {
          console.error('Goal seeding failed', e);
        }
      }
    };
    seedGoals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Form state
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a goal description');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        text: description,
        priority,
        deadline,
        progress: parseInt(progress) || 0
      };
      const res = await api.post('/users/goals', payload);
      const updatedGoals = [...goals, res.data];
      setGoals(updatedGoals);
      setUser(prev => ({ ...prev, goals: updatedGoals }));
      if (onUpdate) onUpdate(updatedGoals);
      
      // Reset form
      setDescription('');
      setPriority('High');
      setDeadline('');
      setProgress(0);
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await api.delete(`/users/goals/${id}`);
      const updatedGoals = goals.filter(g => g._id !== id);
      setGoals(updatedGoals);
      setUser(prev => ({ ...prev, goals: updatedGoals }));
      if (onUpdate) onUpdate(updatedGoals);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const getPriorityDot = (p) => {
    if (p === 'High') return '🔴';
    if (p === 'Medium') return '🟡';
    return '🟢';
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const priorityMap = { High: 0, Medium: 1, Low: 2 };
    if (priorityMap[a.priority] !== priorityMap[b.priority]) {
      return priorityMap[a.priority] - priorityMap[b.priority];
    }
    // Then by closest deadline
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800">My Goals</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white border rounded-xl shadow-sm p-6 relative">
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <h3 className="font-bold text-lg text-slate-800">Add New Goal</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 border border-slate-200 hover:bg-slate-50 rounded px-3 py-1 text-sm font-medium flex items-center gap-2 transition-colors">
                  <X size={14} /> Close
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Goal Description</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Complete DSA sheet by end of month..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm outline-none resize-none"
                    style={{ border: '1px solid #CECBF6', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-10 px-3 text-sm outline-none cursor-pointer"
                      style={{ backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                    <input
                      type="date"
                      min={today}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full h-10 px-3 text-sm outline-none cursor-pointer"
                      style={{ backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Progress: {progress}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200"
                    style={{
                      background: `linear-gradient(to right, #7C3AED ${progress}%, #E2E8F0 ${progress}%)`
                    }}
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-6">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddGoal}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    {loading ? 'Saving...' : 'Save Goal →'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {sortedGoals.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-sm font-medium">
            No goals yet. Add one to get started!
          </div>
        )}
        {sortedGoals.map((goal) => (
          <div key={goal._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative group">
            <button 
              onClick={() => handleDeleteGoal(goal._id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex gap-3 mb-3 pr-8">
              <span className="shrink-0 leading-tight">{getPriorityDot(goal.priority)}</span>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">{goal.text}</h3>
            </div>
            
            <div className="pl-7 space-y-3">
               <div className="text-xs font-semibold text-slate-400">
                 Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric'}) : 'None'}
               </div>
               <div className="flex items-center gap-3">
                 <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full rounded-full transition-all duration-500" 
                     style={{ width: `${goal.progress || 0}%`, backgroundColor: '#7C3AED' }} 
                   />
                 </div>
                 <span className="text-xs font-bold text-slate-500">{goal.progress || 0}%</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalTracker;
