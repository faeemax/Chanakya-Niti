import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, remove, get } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { User, Wallet, Users, Award, Landmark, Trash2, Calendar } from 'lucide-react';

const Profile = () => {
  const { user, refreshUser, logout } = useAuth();

  const handleCollectSalary = async () => {
    if (user.lastSalary && Date.now() - user.lastSalary < 86400000) {
      const remaining = 86400000 - (Date.now() - user.lastSalary);
      const hours = Math.ceil(remaining / 3600000);
      alert(`Salary is available in ${hours} hours.`);
      return;
    }

    let totalSalary = 0;
    (user.positions || []).forEach(pos => {
      if (pos.type === 'mla') totalSalary += 15000;
      else if (pos.type === 'minister') totalSalary += 20000;
      else if (pos.type === 'cm') totalSalary += 35000;
    });

    if (totalSalary === 0) {
      alert("You hold no salaried positions.");
      return;
    }

    try {
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: (user.balance || 0) + totalSalary,
        lastSalary: Date.now()
      });
      refreshUser();
      alert(`Collected ₹${totalSalary.toLocaleString()} in imperial salary.`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ PERMANENT DESTRUCTION: This will erase your legacy, balance, and positions. This cannot be undone. Proceed?")) return;
    
    try {
      // 1. Remove from party count if applicable
      if (user.party && user.party !== 'None') {
        const countRef = ref(db, `partyCounts/${user.party}`);
        const countSnap = await get(countRef);
        if (countSnap.exists()) {
          await update(ref(db, 'partyCounts'), { [user.party]: Math.max(0, countSnap.val() - 1) });
        }
      }

      // 2. Delete user data
      await remove(ref(db, `users/${user.username}`));
      await remove(ref(db, `portfolios/${user.username}`));
      await remove(ref(db, `tradeRequests/${user.username}`));
      
      // 3. Clear local storage
      localStorage.removeItem('has_account');
      logout();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Imperial Identity</h1>
        <p className="text-royal-muted font-medium">Manage your personal standing and collection of dues.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* User Details */}
          <section className="card-royal">
            <div className="flex items-center gap-6 mb-10">
              <div className="p-6 bg-royal-bg rounded-[32px] border border-white/5 text-royal-primary shadow-inner">
                <User size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{user?.username}</h2>
                <p className="text-royal-muted font-bold flex items-center gap-2">
                  <Award size={16} className="text-royal-secondary" /> {user?.leaderTag || 'Independent Strategist'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-royal-bg rounded-2xl border border-white/5">
                <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Imperial Treasury</p>
                <p className="text-xl font-black text-white">₹{(user?.balance || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-royal-bg rounded-2xl border border-white/5">
                <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Political Affiliation</p>
                <p className="text-xl font-black text-white">{user?.party || 'None'}</p>
              </div>
            </div>
          </section>

          {/* Active Positions */}
          <section className="card-royal">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <Landmark size={24} className="text-royal-primary" /> Active Roles
            </h3>
            <div className="space-y-4">
              {(user?.positions || []).length > 0 ? (
                user.positions.map((pos, idx) => (
                  <div key={idx} className="p-4 bg-royal-bg rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">{pos.title}</p>
                      <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">{pos.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-royal-success font-black">
                        +₹{pos.type === 'mla' ? '15,000' : pos.type === 'minister' ? '20,000' : '35,000'}
                      </p>
                      <p className="text-[9px] text-royal-muted font-bold uppercase">Daily Stipend</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-royal-muted font-medium italic">You currently hold no official positions in the dominion.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Salary Collection */}
          <section className="card-royal border-royal-primary/20 bg-royal-primary/5">
            <h3 className="text-lg font-black text-white mb-4">Imperial Dues</h3>
            <p className="text-sm text-royal-muted mb-8 leading-relaxed">
              As a public servant, you are entitled to a daily stipend for each role you fulfill.
            </p>
            <button 
              onClick={handleCollectSalary}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <Wallet size={18} /> Collect All Salary
            </button>
            <p className="text-[10px] text-center text-royal-muted mt-4 font-bold uppercase tracking-widest">
              Available once every 24 hours
            </p>
          </section>

          {/* Dangerous Actions */}
          <section className="card-royal border-royal-danger/20">
            <h3 className="text-lg font-black text-white mb-4">Legacy Management</h3>
            <button 
              onClick={handleDeleteAccount}
              className="w-full py-4 bg-royal-danger/10 text-royal-danger border border-royal-danger/20 rounded-2xl font-bold hover:bg-royal-danger/20 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Resign & Erase Legacy
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
