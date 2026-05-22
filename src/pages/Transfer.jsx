import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, get } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { Send, User, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';

const Transfer = () => {
  const { user, refreshUser } = useAuth();
  const [targetUser, setTargetUser] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    const transferAmount = parseInt(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (user.balance < transferAmount) {
      alert("Insufficient Balance");
      return;
    }

    if (targetUser === user.username) {
      alert("You cannot transfer to yourself.");
      return;
    }

    setLoading(true);
    try {
      const targetRef = ref(db, `users/${targetUser}`);
      const targetSnap = await get(targetRef);

      if (!targetSnap.exists()) {
        alert("Target user does not exist in the dominion.");
        return;
      }

      const targetData = targetSnap.val();
      
      // Execute Transfer
      await update(ref(db, `users/${user.username}`), {
        balance: user.balance - transferAmount
      });
      
      await update(targetRef, {
        balance: (targetData.balance || 0) + transferAmount
      });

      refreshUser();
      setTargetUser('');
      setAmount('');
      alert(`Successfully transferred ₹${transferAmount.toLocaleString()} to ${targetUser}.`);
    } catch (error) {
      console.error(error);
      alert("Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Imperial Transfer</h1>
        <p className="text-royal-muted font-medium">Reallocate capital across the dominion's elite.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <section className="card-royal">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-royal-primary/10 rounded-2xl text-royal-primary border border-white/5">
              <Send size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Execution Chamber</h2>
          </div>

          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Recipient Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-muted" size={20} />
                <input 
                  type="text" 
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="input-royal pl-12" 
                  placeholder="The Target Strategist"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Transfer Amount (₹)</label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-muted" size={20} />
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-royal pl-12" 
                  placeholder="Enter imperial sum"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              Confirm Transaction <ShieldCheck size={24} />
            </button>
          </form>
        </section>

        <section className="space-y-8">
          <div className="card-royal border-royal-primary/20 bg-royal-primary/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-royal-primary/10 rounded-lg text-royal-primary">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-white">Security Protocol</h3>
            </div>
            <ul className="space-y-3 text-sm text-royal-muted">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-primary mt-1.5 shrink-0" />
                <span>Transfers are instantaneous and irreversible.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-primary mt-1.5 shrink-0" />
                <span>Ensure the recipient's username is exact to avoid loss of capital.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-primary mt-1.5 shrink-0" />
                <span>Excessive reallocations may attract attention from the central board.</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-[40px] bg-royal-surface border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Wallet size={120} />
             </div>
             <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Your Liquidity</p>
             <p className="text-4xl font-black text-white">₹{(user?.balance || 0).toLocaleString()}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Transfer;
