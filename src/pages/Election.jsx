import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ELECTION_STATES } from '../constants/electionData';
import { ref, update, get, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Vote, PieChart, TrendingUp, Coins, ChevronRight, X, BarChart3, History } from 'lucide-react';

const Election = () => {
  const { user, refreshUser } = useAuth();
  const [activeElection, setActiveElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showExitPollModal, setShowExitPollModal] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatData, setSeatData] = useState({});
  const [resultsData, setResultsData] = useState(null);

  useEffect(() => {
    const activeRef = ref(db, 'activeElection');
    const unsubscribe = onValue(activeRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveElection(snapshot.val());
        loadElectionData(snapshot.val().state);
      } else {
        setActiveElection(null);
      }
    });

    const resultsRef = ref(db, 'electionResults');
    const unsubscribeResults = onValue(resultsRef, (snapshot) => {
        if (snapshot.exists()) setResultsData(snapshot.val());
    });

    return () => {
        unsubscribe();
        unsubscribeResults();
    };
  }, []);

  const loadElectionData = (state) => {
    const electionRef = ref(db, `elections/${state}`);
    onValue(electionRef, (snapshot) => {
      if (snapshot.exists()) {
        setSeatData(snapshot.val());
      } else {
        setSeatData({});
      }
    });
  };

  const handleConvertVotes = async () => {
    const amount = parseInt(prompt("Enter amount of money to convert (100 ₹ = 1 Vote):"));
    if (isNaN(amount) || amount < 100) return;
    if (user.balance < amount) {
      alert("Insufficient Balance");
      return;
    }

    setLoading(true);
    try {
      const votesToAdd = Math.floor(amount / 100);
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: user.balance - amount,
        votes: (user.votes || 0) + votesToAdd
      });
      refreshUser();
      alert(`Successfully converted ₹${amount} into ${votesToAdd} votes.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const castVotes = async (amount) => {
    if (!activeElection || !selectedSeat) return;
    if (user.party === 'None') {
      alert("You must join a party to cast votes.");
      return;
    }
    if ((user.votes || 0) < amount) {
      alert("Not enough votes.");
      return;
    }

    setLoading(true);
    try {
      const state = activeElection.state;
      const seatRef = ref(db, `elections/${state}/${selectedSeat}/${user.party}`);
      const snap = await get(seatRef);
      const currentVotes = snap.exists() ? snap.val() : 0;

      await update(ref(db, `elections/${state}/${selectedSeat}`), {
        [user.party]: currentVotes + amount
      });

      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        votes: (user.votes || 0) - amount
      });

      refreshUser();
      setShowVoteModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExitPoll = () => {
    if (!activeElection) return {};
    const poll = {};
    Object.values(seatData).forEach(seat => {
        const sorted = Object.entries(seat).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            const winner = sorted[0][0];
            poll[winner] = (poll[winner] || 0) + 1;
        }
    });
    return poll;
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Election Center</h1>
          <p className="text-royal-muted font-medium">Manifest your political power through the ballot box.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setShowResultsModal(true)}
                className="p-3 bg-royal-bg text-royal-muted rounded-xl border border-white/5 hover:text-white transition-all"
                title="Historical Results"
            >
                <History size={20} />
            </button>
            <button 
            onClick={handleConvertVotes}
            className="btn-primary flex items-center gap-2"
            >
            <Coins size={20} /> Convert Votes
            </button>
        </div>
      </header>

      {!activeElection ? (
        <div className="card-royal text-center py-20">
          <Landmark size={64} className="mx-auto text-royal-muted mb-6 opacity-20" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Elections</h2>
          <p className="text-royal-muted">The democratic process is currently at rest. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card-royal bg-royal-primary/5 border-royal-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-royal-primary/10 rounded-2xl text-royal-primary">
                <Vote size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{activeElection.state} General Election</h2>
                <p className="text-sm text-royal-primary font-bold uppercase tracking-widest">Election is LIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
               <button 
                 onClick={() => setShowExitPollModal(true)}
                 className="flex items-center gap-2 text-royal-muted hover:text-royal-primary transition-colors font-bold text-sm"
               >
                  <BarChart3 size={18} /> Exit Poll
               </button>
               <div className="text-right border-l border-white/5 pl-8">
                 <p className="text-xs text-royal-muted font-black uppercase tracking-widest mb-1">Your Votes</p>
                 <p className="text-2xl font-black text-white">{(user?.votes || 0).toLocaleString()}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ELECTION_STATES[activeElection.state]?.map((seat) => {
              const votes = seatData[seat] || {};
              const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

              return (
                <motion.div 
                  key={seat}
                  whileHover={{ y: -5 }}
                  className="card-royal"
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white">{seat}</h3>
                    <div className="text-[10px] font-black text-royal-muted uppercase tracking-widest">
                      {totalVotes.toLocaleString()} Votes
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {Object.entries(votes).length > 0 ? (
                      Object.entries(votes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([party, count]) => (
                        <div key={party} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span className="text-white">{party}</span>
                            <span className="text-royal-muted">{Math.round((count/totalVotes)*100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-royal-bg rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(count/totalVotes)*100}%` }}
                              className="h-full bg-royal-primary"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-royal-muted italic">No votes cast yet in this constituency.</p>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedSeat(seat);
                      setShowVoteModal(true);
                    }}
                    className="w-full py-3 bg-royal-surface border border-white/10 hover:border-royal-primary/50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    Cast Vote <ChevronRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exit Poll Modal */}
      <AnimatePresence>
        {showExitPollModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitPollModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-royal-surface w-full max-w-lg rounded-[40px] p-8 border border-white/5 relative z-10">
                <button onClick={() => setShowExitPollModal(false)} className="absolute top-6 right-6 text-royal-muted hover:text-white"><X size={24}/></button>
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><TrendingUp size={28} className="text-royal-primary"/> Exit Poll Predictions</h2>
                <div className="space-y-6">
                    {Object.entries(calculateExitPoll()).sort((a, b) => b[1] - a[1]).map(([party, seats]) => (
                        <div key={party} className="p-4 bg-royal-bg rounded-2xl border border-white/5 flex justify-between items-center">
                            <span className="font-bold text-white">{party}</span>
                            <span className="text-xl font-black text-royal-primary">{seats} <span className="text-[10px] text-royal-muted uppercase ml-1">Projected Seats</span></span>
                        </div>
                    ))}
                    {Object.keys(calculateExitPoll()).length === 0 && <p className="text-center text-royal-muted italic py-10">Insufficient data for prediction.</p>}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Historical Results Modal */}
      <AnimatePresence>
        {showResultsModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResultsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-royal-surface w-full max-w-3xl rounded-[40px] p-8 border border-white/5 relative z-10 max-h-[80vh] overflow-y-auto">
                    <button onClick={() => setShowResultsModal(false)} className="absolute top-6 right-6 text-royal-muted hover:text-white"><X size={24}/></button>
                    <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><History size={28} className="text-royal-secondary"/> Historical Proclamations</h2>
                    <div className="space-y-8">
                        {resultsData ? Object.entries(resultsData).reverse().map(([state, data]) => (
                            <div key={state} className="card-royal bg-royal-bg/50">
                                <h3 className="text-xl font-bold text-white mb-4">{state} Results</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(data.summary || {}).sort((a, b) => b[1] - a[1]).map(([party, count]) => (
                                        <div key={party} className="p-3 bg-royal-surface rounded-xl border border-white/5 text-center">
                                            <p className="text-[10px] text-royal-muted font-black uppercase mb-1">{party}</p>
                                            <p className="text-lg font-black text-white">{count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <p className="text-center text-royal-muted italic py-20">The archives are currently empty.</p>}
                    </div>
                </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Vote Modal */}
      <AnimatePresence>
        {showVoteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-royal-surface w-full max-w-md rounded-[40px] p-8 border border-white/5 relative z-10"
            >
              <button 
                onClick={() => setShowVoteModal(false)}
                className="absolute top-6 right-6 text-royal-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-white mb-2">Cast Votes</h2>
              <p className="text-royal-muted mb-8 font-medium">Constituency: <span className="text-royal-primary">{selectedSeat}</span></p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[100, 500, 2000, 5000, 10000, 25000].map((amt) => (
                  <button 
                    key={amt}
                    onClick={() => castVotes(amt)}
                    disabled={loading || (user?.votes || 0) < amt}
                    className={`py-4 rounded-2xl font-bold transition-all border ${ (user?.votes || 0) >= amt ? 'bg-royal-bg border-white/5 hover:border-royal-primary/50 text-white' : 'bg-royal-bg/30 border-transparent text-royal-muted cursor-not-allowed opacity-50' }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-royal-primary/5 rounded-2xl border border-royal-primary/10 flex justify-between items-center">
                <span className="text-xs font-bold text-royal-primary uppercase tracking-widest">Your Power</span>
                <span className="text-lg font-black text-white">{(user?.votes || 0).toLocaleString()} Votes</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Election;
