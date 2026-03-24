import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Wallet, Calendar, Tag, DollarSign, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeExpenses } from '../services/geminiService';

export default function ExpenseTracker({ user }: { user: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [aiTips, setAiTips] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/expenses`));
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'expenses'), {
        uid: user.uid,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date().toISOString()
      });
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/expenses`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/expenses/${id}`);
    }
  };

  const handleAnalyze = async () => {
    if (expenses.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const tips = await analyzeExpenses(expenses.slice(0, 20));
      setAiTips(tips);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Other'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      <div className="lg:col-span-2 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
          <p className="text-zinc-500">Manage your daily spending and get AI insights.</p>
        </header>

        {/* Add Expense Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was it for?"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="bg-emerald-500 text-black font-bold py-2.5 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold">Recent Transactions</h3>
            <span className="text-xs text-zinc-500">{expenses.length} total</span>
          </div>
          <div className="divide-y divide-zinc-800">
            <AnimatePresence initial={false}>
              {expenses.map((exp) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">{exp.description || exp.category}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="px-1.5 py-0.5 bg-zinc-800 rounded uppercase font-bold text-[10px]">{exp.category}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-red-400">-${exp.amount}</span>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {expenses.length === 0 && (
              <div className="p-12 text-center space-y-2">
                <Wallet className="w-12 h-12 text-zinc-800 mx-auto" />
                <p className="text-zinc-500">No expenses recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Sidebar */}
      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              AI Insights
            </h3>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || expenses.length === 0}
              className="text-xs font-bold text-emerald-500 hover:underline disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>

          <div className="space-y-4">
            {aiTips.length > 0 ? aiTips.map((tip, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2"
              >
                <p className="text-sm text-zinc-300 leading-relaxed">{tip.tip}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Potential Savings:</span>
                  <span className="text-xs font-bold text-white">{tip.potentialSavings}</span>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-sm text-zinc-500">Get personalized savings tips based on your spending patterns.</p>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || expenses.length === 0}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-all"
                >
                  Analyze Spending
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
