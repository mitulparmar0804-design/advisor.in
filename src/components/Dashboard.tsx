import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Target,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard({ user, profile }: { user: any, profile: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/expenses`));
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'goals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/goals`));
    return () => unsubscribe();
  }, [user.uid]);

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyIncome = profile?.income || 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Mon', amount: 400 },
    { name: 'Tue', amount: 300 },
    { name: 'Wed', amount: 600 },
    { name: 'Thu', amount: 800 },
    { name: 'Fri', amount: 500 },
    { name: 'Sat', amount: 900 },
    { name: 'Sun', amount: 700 },
  ];

  const categoryData = [
    { name: 'Food', value: 400, color: '#10b981' },
    { name: 'Rent', value: 1200, color: '#06b6d4' },
    { name: 'Transport', value: 300, color: '#f59e0b' },
    { name: 'Entertainment', value: 200, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName?.split(' ')[0]}</h1>
          <p className="text-zinc-500">Here's your financial health overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Health Score: 84/100</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Income', value: `$${monthlyIncome}`, icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Expenses', value: `$${totalExpenses}`, icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Savings Rate', value: `${savingsRate}%`, icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { label: 'Active Goals', value: goals.length, icon: Target, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${stat.bg} rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs text-zinc-500 font-medium">+12% vs last month</span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Spending Trends</h3>
            <select className="bg-zinc-800 border-none text-xs rounded-lg px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <h3 className="text-lg font-bold mb-8">Categories</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">$2.1k</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-zinc-400">{cat.name}</span>
                </div>
                <span className="text-sm font-medium">${cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <button className="text-emerald-500 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {expenses.length > 0 ? expenses.map((exp, i) => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{exp.description || exp.category}</p>
                    <p className="text-xs text-zinc-500">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="font-semibold text-red-400">-${exp.amount}</span>
              </div>
            )) : (
              <p className="text-zinc-500 text-center py-8">No transactions yet.</p>
            )}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Goals Progress</h3>
            <button className="text-emerald-500 text-sm font-medium hover:underline">Manage Goals</button>
          </div>
          <div className="space-y-6">
            {goals.length > 0 ? goals.map((goal, i) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-zinc-500">${goal.currentAmount} / ${goal.targetAmount}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            }) : (
              <p className="text-zinc-500 text-center py-8">No goals set yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
