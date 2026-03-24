import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout, db, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Wallet, 
  TrendingUp, 
  LogOut, 
  User as UserIcon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

// Components
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import ExpenseTracker from './components/ExpenseTracker';
import WealthPlanner from './components/WealthPlanner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // Initial profile creation
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              income: 5000,
              riskAppetite: 'medium',
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Investment Advisor
            </h1>
            <p className="text-zinc-400 text-lg">Your AI-driven financial pathfinder.</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-left p-4 rounded-2xl bg-zinc-800/50">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="text-emerald-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">Smart Advisory</h3>
                  <p className="text-xs text-zinc-500 text-balance">Personalized wealth planning powered by Gemini.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left p-4 rounded-2xl bg-zinc-800/50">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Wallet className="text-cyan-500 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">Expense Insights</h3>
                  <p className="text-xs text-zinc-500 text-balance">Automatic categorization and savings tips.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={loginWithGoogle}
              className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" referrerPolicy="no-referrer" />
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'wealth', label: 'Wealth', icon: TrendingUp },
    { id: 'chat', label: 'AI Advisor', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-zinc-800 flex flex-col p-4 fixed h-full bg-[#050505] z-50">
        <div className="flex items-center gap-3 px-2 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter hidden lg:block">Investment Advisor</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="font-medium hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-full border border-zinc-700"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 p-3 rounded-2xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span className="font-medium hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {activeTab === 'dashboard' && <Dashboard user={user} profile={profile} />}
            {activeTab === 'expenses' && <ExpenseTracker user={user} />}
            {activeTab === 'wealth' && <WealthPlanner user={user} />}
            {activeTab === 'chat' && <Chatbot user={user} profile={profile} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
