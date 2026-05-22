import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PARTIES } from '../constants/gameData';
import { ref, update, get, onValue, set } from 'firebase/database';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, LogOut, ShieldCheck, Landmark, ChevronLeft, Award, Crown, Wallet, TrendingUp, UserMinus, Shield, X } from 'lucide-react';

const Party = () => {
  const { user, refreshUser } = useAuth();
  const [parties, setParties] = useState([]);
  const [partyCounts, setPartyCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'internal'
  const [partyMembers, setPartyMembers] = useState([]);
  const [partyFund, setPartyFund] = useState(0);
  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [cabinetTarget, setCabinetTarget] = useState(null);

  useEffect(() => {
    const countsRef = ref(db, 'partyCounts');
    const unsubscribeCounts = onValue(countsRef, (snapshot) => {
      if (snapshot.exists()) {
        setPartyCounts(snapshot.val());
      }
    });

    const loadParties = async () => {
      const snap = await get(ref(db, 'customParties'));
      let allParties = [...DEFAULT_PARTIES];
      if (snap.exists()) {
        Object.values(snap.val()).forEach(p => {
          if (!allParties.find(x => x.name === p.name)) {
            allParties.push({ name: p.name, ideology: p.ideology });
          }
        });
      }
      setParties(allParties);
    };

    loadParties();
    return () => unsubscribeCounts();
  }, []);

  useEffect(() => {
    if (view === 'internal' && user?.party !== 'None') {
      const partyName = user.party;
      
      const fundRef = ref(db, `partyFunds/${partyName}`);
      const unsubscribeFund = onValue(fundRef, (snapshot) => {
        setPartyFund(snapshot.exists() ? snapshot.val() : 0);
      });

      const usersRef = ref(db, 'users');
      const unsubscribeMembers = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const allUsers = snapshot.val();
          const members = Object.values(allUsers)
            .filter(u => u.party === partyName)
            .map(u => ({
              username: u.username,
              leaderTag: u.leaderTag,
              mlaTitle: u.mlaTitle,
              ministryTitle: u.ministryTitle,
              positions: u.positions || []
            }));
          setPartyMembers(members);
        }
      });

      return () => {
        unsubscribeFund();
        unsubscribeMembers();
      };
    }
  }, [view, user?.party]);

  const handleJoin = async (partyName) => {
    if (user.party !== 'None') {
      alert("Leave your current party first.");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      const countRef = ref(db, `partyCounts/${partyName}`);
      const countSnap = await get(countRef);
      const currentCount = countSnap.exists() ? countSnap.val() : 0;

      await update(userRef, { party: partyName });
      await update(ref(db, 'partyCounts'), { [partyName]: currentCount + 1 });
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave your party?")) return;

    setLoading(true);
    try {
      const partyName = user.party;
      const userRef = ref(db, `users/${user.username}`);
      const countRef = ref(db, `partyCounts/${partyName}`);
      const countSnap = await get(countRef);
      const currentCount = countSnap.exists() ? countSnap.val() : 0;

      await update(userRef, { party: 'None', leaderTag: null });
      await update(ref(db, 'partyCounts'), { [partyName]: Math.max(0, currentCount - 1) });
      
      refreshUser();
      setView('list');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amountStr = prompt("Enter amount to deposit into party fund:");
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    if (user.balance < amount) {
      alert("Insufficient Balance");
      return;
    }

    setLoading(true);
    try {
      const fundRef = ref(db, `partyFunds/${user.party}`);
      const fundSnap = await get(fundRef);
      const currentFund = fundSnap.exists() ? fundSnap.val() : 0;

      await set(fundRef, currentFund + amount);
      await update(ref(db, `users/${user.username}`), { balance: user.balance - amount });
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (targetUsername) => {
    if (user.leaderTag !== `Leader of ${user.party}`) {
      alert("Only the party leader can kick members.");
      return;
    }
    if (!window.confirm(`Are you sure you want to kick ${targetUsername}?`)) return;

    setLoading(true);
    try {
      const targetRef = ref(db, `users/${targetUsername}`);
      const countRef = ref(db, `partyCounts/${user.party}`);
      const countSnap = await get(countRef);
      const currentCount = countSnap.exists() ? countSnap.val() : 0;

      await update(targetRef, { 
        party: 'None', leaderTag: null, positions: [], mlaTitle: null, ministryTitle: null 
      });
      await update(ref(db, 'partyCounts'), { [user.party]: Math.max(0, currentCount - 1) });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCabinet = async (title) => {
    if (!cabinetTarget) return;
    setLoading(true);
    try {
        const targetRef = ref(db, `users/${cabinetTarget.username}`);
        const currentPositions = cabinetTarget.positions || [];
        
        // Remove old ministry position if exists
        const filteredPositions = currentPositions.filter(p => p.type !== 'minister');
        filteredPositions.push({ title, type: 'minister', state: 'National' });

        await update(targetRef, {
            ministryTitle: title,
            positions: filteredPositions
        });
        
        setShowCabinetModal(false);
        setCabinetTarget(null);
        alert(`Assigned ${title} to ${cabinetTarget.username}`);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  if (view === 'internal' && user?.party !== 'None') {
    const isLeader = user.leaderTag === `Leader of ${user.party}`;
    
    return (
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-royal-muted hover:text-white transition-colors font-bold"
          >
            <ChevronLeft size={20} /> Back to Parties
          </button>
          <div className="text-right">
             <h1 className="text-4xl font-black text-white">{user.party} Internal</h1>
             <p className="text-royal-muted text-xs font-black uppercase tracking-widest">Party Management & Treasury</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <section className="card-royal border-royal-primary/20 bg-royal-primary/5">
               <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-royal-primary/10 rounded-xl text-royal-primary"><Wallet size={24} /></div>
                 <h2 className="text-xl font-black text-white">Party Treasury</h2>
               </div>
               <div className="mb-8">
                 <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Available Funds</p>
                 <p className="text-4xl font-black text-white">₹{partyFund.toLocaleString()}</p>
               </div>
               <button onClick={handleDeposit} className="btn-primary w-full py-4 flex items-center justify-center gap-2"><TrendingUp size={18} /> Deposit Funds</button>
            </section>

            <section className="card-royal">
               <h3 className="text-lg font-black text-white mb-6">Imperial Hierarchy</h3>
               <div className="space-y-4 text-sm">
                 <div className="flex justify-between items-center p-3 bg-royal-bg rounded-xl border border-white/5">
                   <span className="text-royal-muted font-medium">Leader Status</span>
                   <span className={isLeader ? "text-royal-primary font-bold" : "text-white font-bold"}>{isLeader ? "Supreme Leader" : "Loyal Member"}</span>
                 </div>
               </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <section className="card-royal min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-white flex items-center gap-3"><Users size={24} className="text-royal-primary" /> Members list</h2>
                <div className="px-4 py-1.5 bg-royal-bg rounded-full border border-white/5 text-[10px] font-black text-royal-muted uppercase tracking-widest">{partyMembers.length} Estratégos</div>
              </div>

              <div className="space-y-4">
                {partyMembers.sort((a, b) => (a.leaderTag ? -1 : 1)).map((member) => (
                  <motion.div key={member.username} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-royal-bg rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border border-white/5 ${member.leaderTag ? 'bg-royal-primary/10 text-royal-primary' : 'bg-royal-surface text-royal-muted'}`}>
                        {member.leaderTag ? <Crown size={20} /> : <Award size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          {member.username} {member.username === user.username && <span className="text-[10px] bg-royal-surface px-2 py-0.5 rounded-full text-royal-muted">You</span>}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {member.leaderTag && <span className="text-[9px] font-black text-royal-primary uppercase">Leader</span>}
                          {member.ministryTitle && <span className="text-[9px] font-black text-royal-secondary uppercase tracking-tight">{member.ministryTitle}</span>}
                          {member.mlaTitle && <span className="text-[9px] font-black text-royal-success uppercase tracking-tight">{member.mlaTitle}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {isLeader && member.username !== user.username && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setCabinetTarget(member); setShowCabinetModal(true); }} className="p-2 text-royal-muted hover:text-royal-secondary" title="Assign Cabinet"><Shield size={20}/></button>
                        <button onClick={() => handleKick(member.username)} className="p-2 text-royal-muted hover:text-royal-danger" title="Expel from Party"><UserMinus size={20} /></button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Cabinet Modal */}
        <AnimatePresence>
            {showCabinetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCabinetModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-royal-surface w-full max-w-md rounded-[40px] p-8 border border-white/5 relative z-10">
                        <button onClick={() => setShowCabinetModal(false)} className="absolute top-6 right-6 text-royal-muted hover:text-white"><X size={24}/></button>
                        <h2 className="text-2xl font-black text-white mb-2">Cabinet Formation</h2>
                        <p className="text-royal-muted mb-8 font-medium">Assign role to <span className="text-royal-primary">{cabinetTarget?.username}</span></p>
                        <div className="grid grid-cols-1 gap-3">
                            {["Home Minister", "Finance Minister", "Defense Minister", "External Affairs", "Health Minister", "Education Minister"].map(role => (
                                <button key={role} onClick={() => handleAssignCabinet(role)} className="p-4 bg-royal-bg hover:bg-royal-primary/10 border border-white/5 hover:border-royal-primary/30 rounded-2xl text-left font-bold text-white transition-all flex justify-between items-center group">
                                    {role}
                                    <ChevronRight size={18} className="text-royal-muted group-hover:text-royal-primary" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Political Parties</h1>
          <p className="text-royal-muted font-medium">Choose your ideology and rise through the ranks.</p>
        </div>
        {user?.party !== 'None' && (
          <div className="flex gap-4">
            <button onClick={() => setView('internal')} className="btn-primary flex items-center gap-2"><Landmark size={20} /> Management</button>
            <button onClick={handleLeave} className="p-3 bg-royal-danger/10 text-royal-danger rounded-xl border border-royal-danger/20 hover:bg-royal-danger/20 transition-all"><LogOut size={20} /></button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {parties.map((party) => {
          const isMember = user?.party === party.name;
          const memberCount = partyCounts[party.name] || 0;
          return (
            <motion.div key={party.name} whileHover={{ y: -5 }} className={`card-royal relative overflow-hidden ${isMember ? 'border-royal-primary/30 ring-1 ring-royal-primary/30' : ''}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-royal-bg rounded-xl text-royal-primary border border-white/5"><Users size={24} /></div>
                <div>
                  <h3 className="text-xl font-bold text-white">{party.name}</h3>
                  <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">{party.ideology}</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-royal-muted font-medium">Active Members</span>
                  <span className="text-white font-black">{memberCount}</span>
                </div>
              </div>
              {isMember ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-royal-primary/10 text-royal-primary rounded-xl font-bold text-sm"><ShieldCheck size={18} /> Current Allegiance</div>
              ) : (
                <button onClick={() => handleJoin(party.name)} disabled={loading || user?.party !== 'None'} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${user?.party === 'None' ? 'bg-royal-surface border border-white/10 text-white hover:border-royal-primary/50' : 'bg-royal-bg text-royal-muted cursor-not-allowed opacity-50'}`}><UserPlus size={18} /> Join Party</button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Party;
