import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Target, Plus, Trash2, Calendar, DollarSign, Loader2, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WealthPlanner({ user }: { user: any }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'goals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/goals`));
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !target || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        uid: user.uid,
        title,
        targetAmount: parseFloat(target),
        currentAmount: parseFloat(current) || 0,
        deadline,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setTarget('');
      setCurrent('');
      setDeadline('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/goals`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateProgress = async (id: string, newAmount: number) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', id), {
        currentAmount: newAmount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/goals/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/goals/${id}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Wealth Planning Hub</h1>
        <p className="text-zinc-500">Set long-term goals and track your journey to financial freedom.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence initial={false}>
              {goals.map((goal) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                return (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 relative group"
                  >
                    <button 
                      onClick={() => handleDelete(goal.id)}
                      className="absolute top-4 right-4 p-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{goal.title}</h3>
                        <p className="text-xs text-zinc-500">Target: ${goal.targetAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        />
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>${goal.currentAmount.toLocaleString()}</span>
                        <span className="text-zinc-500">${goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <input 
                        type="number"
                        placeholder="Add savings..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val)) {
                              handleUpdateProgress(goal.id, goal.currentAmount + val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
                        <Plus className="w-4 h-4 text-emerald-500" />
                      </button>
                    </div>

                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Empty State */}
            {goals.length === 0 && (
              <div className="col-span-full p-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-center space-y-4">
                <Target className="w-12 h-12 text-zinc-800 mx-auto" />
                <div className="space-y-1">
                  <p className="text-zinc-400 font-medium">No goals defined yet</p>
                  <p className="text-sm text-zinc-600">Start by adding your first financial milestone.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Goal Sidebar */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl h-fit sticky top-8">
          <h3 className="text-xl font-bold mb-6">Create New Goal</h3>
          <form onSubmit={handleAddGoal} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Goal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Home, Retirement"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Savings</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Create Goal
            </button>
          </form>

          <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Pro Tip</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Break down large goals into smaller monthly milestones to stay motivated and track progress effectively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
