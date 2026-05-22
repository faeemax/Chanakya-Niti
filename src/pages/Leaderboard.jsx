import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { Trophy, Medal, Users, Wallet, TrendingUp, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('balance'); // 'balance' or 'votes'

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.values(usersData);
        setLeaders(usersList);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedLeaders = [...leaders]
    .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="text-[#FFD700]" size={24} />;
    if (index === 1) return <Medal className="text-[#C0C0C0]" size={24} />;
    if (index === 2) return <Medal className="text-[#CD7F32]" size={24} />;
    return <span className="text-royal-muted font-black">#{index + 1}</span>;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Imperial Rankings</h1>
          <p className="text-royal-muted font-medium">The most powerful and wealthy strategists in the dominion.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search Strategist..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-royal-surface border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-royal-primary/50 transition-all w-full md:w-64"
            />
          </div>
          
          <div className="bg-royal-surface border border-white/5 rounded-2xl p-1 flex">
            <button 
              onClick={() => setSortBy('balance')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${sortBy === 'balance' ? 'bg-royal-primary text-white shadow-lg shadow-royal-primary/20' : 'text-royal-muted hover:text-white'}`}
            >
              WEALTH
            </button>
            <button 
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${sortBy === 'votes' ? 'bg-royal-primary text-white shadow-lg shadow-royal-primary/20' : 'text-royal-muted hover:text-white'}`}
            >
              INFLUENCE
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-royal-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedLeaders.length > 0 ? (
            sortedLeaders.map((leader, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={leader.username}
                className={`card-royal flex items-center gap-4 md:gap-8 hover:border-royal-primary/30 transition-all group ${index < 3 ? 'bg-royal-primary/5 border-royal-primary/10' : ''}`}
              >
                <div className="w-12 flex justify-center shrink-0">
                  {getRankIcon(index)}
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                  <div className="min-w-[150px]">
                    <h3 className="text-lg font-black text-white group-hover:text-royal-primary transition-colors">{leader.username}</h3>
                    <p className="text-xs text-royal-muted font-bold flex items-center gap-1">
                      <Users size={12} className="text-royal-primary" /> {leader.party || 'Independent'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 md:gap-12">
                    <div className="min-w-[120px]">
                      <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Treasury</p>
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-royal-success" />
                        <span className="text-sm font-black text-white">₹{(leader.balance || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="min-w-[100px]">
                      <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Influence</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-royal-primary" />
                        <span className="text-sm font-black text-white">{(leader.votes || 0).toLocaleString()} <span className="text-[10px] text-royal-muted">Votes</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                    <button className="px-4 py-2 bg-royal-bg border border-white/5 rounded-xl text-[10px] font-black text-royal-muted hover:border-royal-primary/30 hover:text-white transition-all">
                        VIEW LEGACY
                    </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card-royal text-center py-20">
              <p className="text-royal-muted font-bold">No strategists found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
