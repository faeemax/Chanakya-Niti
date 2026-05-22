import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Wallet, Trophy, Bell, ArrowRight } from 'lucide-react';
import { ref, get, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="card-royal flex items-center gap-6"
  >
    <div className={`p-4 rounded-2xl bg-royal-bg border border-white/5 ${color}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState([]);
  const [news, setNews] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalWealth: 0, totalVotes: 0, totalUsers: 0 });

  useEffect(() => {
    // Fetch Top Players & Global Stats
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
      if (snapshot.exists()) {
        const users = Object.values(snapshot.val());
        const sorted = users.sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 5);
        setTopPlayers(sorted);

        const totalWealth = users.reduce((acc, u) => acc + (u.balance || 0), 0);
        const totalVotes = users.reduce((acc, u) => acc + (u.votes || 0), 0);
        setGlobalStats({
          totalWealth,
          totalVotes,
          totalUsers: users.length
        });
      }
    });

    // Fetch News
    const newsRef = ref(db, 'news');
    const unsubscribeNews = onValue(newsRef, (snapshot) => {
      if (snapshot.exists()) {
        const newsData = Object.values(snapshot.val()).reverse();
        setNews(newsData);
      } else {
        setNews([
          { title: 'Election Notice', content: 'The Bihar state assembly elections have been announced.', type: 'primary' },
          { title: 'Market Update', content: 'Timber prices have surged by 15% due to increased industrial demand.', type: 'secondary' }
        ]);
      }
    });

    return () => unsubscribeNews();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">
          Salutations, <span className="bg-royal-gradient bg-clip-text text-transparent">{user?.username}</span>
        </h1>
        <p className="text-royal-muted font-medium">Behold your political and industrial dominion.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Imperial Balance" 
          value={`₹${(user?.balance || 0).toLocaleString()}`} 
          icon={Wallet}
          color="text-royal-primary"
        />
        <StatCard 
          label="Political Allegiance" 
          value={user?.party || 'None'} 
          icon={Users}
          color="text-royal-secondary"
        />
        <StatCard 
          label="Commanding Votes" 
          value={(user?.votes || 0).toLocaleString()} 
          icon={TrendingUp}
          color="text-royal-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* News Section */}
        <section className="lg:col-span-2 card-royal">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Bell size={24} className="text-royal-primary" /> Imperial Bulletins
            </h2>
            <span className="text-[10px] font-black text-royal-muted uppercase tracking-widest">Live Updates</span>
          </div>
          
          <div className="space-y-4">
            {news.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="p-4 bg-royal-bg/50 rounded-2xl border border-white/5 group hover:border-royal-primary/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${item.type === 'primary' ? 'text-royal-primary' : 'text-royal-secondary'}`}>
                      {item.title}
                    </span>
                    <p className="text-sm text-royal-text leading-relaxed">{item.content}</p>
                  </div>
                  <span className="text-[9px] text-royal-muted font-bold whitespace-nowrap ml-4">JUST NOW</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Top Strategists Sidebar */}
        <section className="card-royal border-royal-primary/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Trophy size={24} className="text-royal-secondary" /> Elite
            </h2>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="text-[10px] font-black text-royal-primary uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
            >
              Full List <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-6">
            {topPlayers.map((player, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-royal-primary text-white shadow-lg shadow-royal-primary/20' : 'bg-royal-bg text-royal-muted border border-white/5'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white leading-tight">{player.username}</p>
                  <p className="text-[10px] text-royal-muted font-bold uppercase tracking-widest">₹{(player.balance || 0).toLocaleString()}</p>
                </div>
                {idx === 0 && <Trophy size={16} className="text-royal-primary" />}
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-royal-primary/5 rounded-[32px] border border-royal-primary/10 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-sm font-black text-white mb-2">Imperial Strategy</h3>
              <p className="text-[11px] text-royal-muted leading-relaxed mb-4">
                "The foundation of a kingdom is its treasury."
              </p>
              <button className="text-[10px] font-black text-royal-primary uppercase tracking-widest group-hover:underline">
                Read Chanakya's Niti
              </button>
            </div>
            <Landmark size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <TrendingUp size={24} className="text-royal-success" /> Imperial Economy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-royal">
            <p className="stat-label">Total Circulating Wealth</p>
            <p className="text-2xl font-black text-white">₹{globalStats.totalWealth.toLocaleString()}</p>
          </div>
          <div className="card-royal">
            <p className="stat-label">Active Strategists</p>
            <p className="text-2xl font-black text-white">{globalStats.totalUsers}</p>
          </div>
          <div className="card-royal">
            <p className="stat-label">Total Electoral Power</p>
            <p className="text-2xl font-black text-white">{globalStats.totalVotes.toLocaleString()}</p>
          </div>
          <div className="card-royal bg-royal-primary/5 border-royal-primary/20">
            <p className="stat-label text-royal-primary">Avg. Strategist Worth</p>
            <p className="text-2xl font-black text-white">₹{Math.floor(globalStats.totalWealth / (globalStats.totalUsers || 1)).toLocaleString()}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const Landmark = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="22" x2="21" y2="22"></line>
    <line x1="6" y1="18" x2="6" y2="11"></line>
    <line x1="10" y1="18" x2="10" y2="11"></line>
    <line x1="14" y1="18" x2="14" y2="11"></line>
    <line x1="18" y1="18" x2="18" y2="11"></line>
    <polygon points="12 2 20 7 4 7 12 2"></polygon>
  </svg>
);

export default Dashboard;
