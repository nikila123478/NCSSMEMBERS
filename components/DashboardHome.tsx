import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { TrendingUp, Wallet, Users, Clock, Globe, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { db } from '../utils/firebase';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface SiteSettings {
  missionTitle?: string;
  visionTitle?: string;
}

const FinanceCard = ({ title, amount, subtext, icon: Icon, color, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between overflow-hidden shadow-lg group hover:scale-[1.02] transition-transform duration-300"
    >
      {/* Text Section (Flex-1 + min-w-0 prevents overflow) */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1 truncate">
          {typeof amount === 'number' && title !== 'Total Users' ? formatCurrency(amount) : amount}
        </h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>

      {/* Icon Section (Shrink-0 prevents squashing) */}
      <div className={`ml-4 shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Background Glow */}
      <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full ${color.replace('text-', 'bg-')} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
    </motion.div>
  );
};

const DashboardHome: React.FC = () => {
  const { users: contextUsers } = useStore();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [realUserCount, setRealUserCount] = useState(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // 1. Fetch Transactions
  useEffect(() => {
    const q = query(collection(db, 'funds'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Pending Requests
  useEffect(() => {
    const q = query(collection(db, 'project_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingProjects(data);
    });
    return () => unsubscribe();
  }, []);

  // 3. Fetch Users
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snap) => setRealUserCount(snap.size));
    return () => unsubscribe();
  }, []);

  // 4. Site Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'homepage');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSiteSettings(docSnap.data() as SiteSettings);
        }
      } catch (e) { console.error(e); }
    };
    fetchSettings();
  }, []);

  // 5. Fetch Next Event
  const [nextEvent, setNextEvent] = useState<any>(null);
  useEffect(() => {
    const q = query(collection(db, 'events')); // Fetch all then filter client side for simplicity with date strings
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const now = new Date();

      // Filter future events
      const futureEvents = events.filter(e => new Date(e.date) > now);

      // Sort by nearest date ascending
      futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setNextEvent(futureEvents.length > 0 ? futureEvents[0] : null);
    });
    return () => unsubscribe();
  }, []);

  // Time State
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Colombo',
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const { totalBalance, monthlyIncome } = useMemo(() => {
    let balance = 0;
    let mIncome = 0;
    const now = new Date();
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const type = t.type ? t.type.toLowerCase() : 'expense';
      const tDate = new Date(t.date);
      if (type === 'income') {
        balance += amount;
        if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
          mIncome += amount;
        }
      } else {
        balance -= amount;
      }
    });
    return { totalBalance: balance, monthlyIncome: mIncome };
  }, [transactions]);

  // Time Range Filter State
  const [timeRange, setTimeRange] = useState(30);

  const chartData = useMemo(() => {
    const data: { name: string; Income: number; Expense: number; fullDate: string }[] = [];
    const today = new Date();

    // 1. Generate Date Array for the selected range (Reverse order: Oldest -> Newest)
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayLabel = d.toLocaleString('default', { month: 'short', day: 'numeric' }); // "Oct 12"
      const dateKey = d.toDateString(); // "Mon Oct 12 2025" for matching

      let income = 0;
      let expense = 0;

      // 2. Aggregate Transactions for this day
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.toDateString() === dateKey) {
          const amount = Number(t.amount) || 0;
          const type = t.type ? t.type.toLowerCase() : 'expense';
          if (type === 'income') income += amount;
          else expense += amount;
        }
      });

      data.push({ name: dayLabel, Income: income, Expense: expense, fullDate: dateKey });
    }
    return data;
  }, [transactions, timeRange]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2 relative">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight text-glow">Mission Control</h2>
            <p className="text-gray-400">Overview of system status and finances.</p>
          </div>

          {/* Real-Time Clock - Moved Here */}
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="flex items-center gap-2 text-red-500 font-bold tracking-widest uppercase text-xs">
              <Clock className="w-3 h-3" /> COLOMBO, LK
            </div>
            <div className="text-3xl font-black text-white tabular-nums tracking-tight text-glow">
              {currentTime}
            </div>
            <div className="text-sm font-bold text-gray-400 uppercase">
              {currentDate}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceCard
          title="Total Users"
          amount={realUserCount > 0 ? realUserCount : contextUsers.length}
          icon={Users}
          color="text-blue-400"
          subtext="Active Members"
          delay={0}
        />
        <FinanceCard
          title="Net Balance"
          amount={totalBalance}
          icon={Wallet}
          color="text-white"
          subtext="Available Funds"
          delay={0.1}
        />
        <FinanceCard
          title="Monthly Income"
          amount={monthlyIncome}
          icon={TrendingUp}
          color="text-green-400"
          subtext="This Month"
          delay={0.2}
        />
        <FinanceCard
          title="Pending Requests"
          amount={pendingProjects.length}
          icon={Clock}
          color="text-orange-400"
          subtext="Action Required"
          delay={0.3}
        />
      </div>

      {/* Chart and Side Panels (unchanged logic, just re-rendering) */}
      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6 rounded-3xl h-[400px]"
        >
          <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
            Details
            <div className="flex gap-2">
              {[10, 30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${timeRange === days
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </h3>
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-3xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" /> Up Next
              </h3>
              {nextEvent && <span className="text-[10px] font-black text-red-500 bg-red-900/20 px-2 py-1 rounded uppercase tracking-wider">UPCOMING</span>}
            </div>

            {nextEvent ? (
              <div className="relative group overflow-hidden rounded-2xl">
                {/* Event Image / Gradient Fallback */}
                <div className="h-32 w-full bg-gradient-to-br from-red-900/40 to-black relative">
                  {nextEvent.imageUrl && (
                    <img src={nextEvent.imageUrl} alt={nextEvent.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  )}
                </div>

                <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/60 to-transparent">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                    {new Date(nextEvent.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(nextEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <h4 className="text-lg font-black text-white leading-tight">{nextEvent.title}</h4>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                <Calendar className="w-8 h-8 opacity-20" />
                No upcoming events.
              </div>
            )}
          </motion.div>

          {/* Pending Requests List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-3xl"
          >
            <h3 className="text-lg font-bold mb-4 text-white">Pending Actions</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {pendingProjects.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                  All clear. No requests.
                </div>
              )}
              {pendingProjects.slice(0, 5).map(req => (
                <div key={req.id} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">PENDING</span>
                    <span className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">{formatCurrency(req.estimatedCost)}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-300 line-clamp-1">{req.title}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div >
  );
};

export default DashboardHome;