import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { Landmark, Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, History, ShieldCheck } from 'lucide-react';

const Bank = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankData, setBankData] = useState({ balance: 0, lastInterest: 0 });

  useEffect(() => {
    if (!user) return;
    const bankRef = ref(db, `banks/${user.username}`);
    const unsubscribe = onValue(bankRef, (snapshot) => {
      if (snapshot.exists()) {
        setBankData(snapshot.val());
      } else {
        setBankData({ balance: 0, lastInterest: Date.now() });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeposit = async () => {
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;
    if (user.balance < val) {
      alert("Insufficient Balance in Imperial Treasury.");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      const bankRef = ref(db, `banks/${user.username}`);
      
      await update(userRef, { balance: user.balance - val });
      await update(bankRef, { 
        balance: (bankData.balance || 0) + val,
        lastInterest: bankData.lastInterest || Date.now()
      });
      
      setAmount('');
      refreshUser();
      alert(`Deposited ₹${val.toLocaleString()} into the Imperial Bank.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return;
    if (bankData.balance < val) {
      alert("Insufficient Balance in Bank Account.");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      const bankRef = ref(db, `banks/${user.username}`);
      
      await update(userRef, { balance: (user.balance || 0) + val });
      await update(bankRef, { balance: bankData.balance - val });
      
      setAmount('');
      refreshUser();
      alert(`Withdrew ₹${val.toLocaleString()} from the Imperial Bank.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePendingInterest = () => {
    if (!bankData.balance || !bankData.lastInterest) return 0;
    const now = Date.now();
    const diff = now - bankData.lastInterest;
    const days = diff / (24 * 60 * 60 * 1000);
    const rate = 0.01; // 1% Daily
    return Math.floor(bankData.balance * rate * days);
  };

  const handleClaimInterest = async () => {
    const interest = calculatePendingInterest();
    if (interest <= 0) {
      alert("No significant interest accumulated yet.");
      return;
    }

    setLoading(true);
    try {
      const bankRef = ref(db, `banks/${user.username}`);
      await update(bankRef, {
        balance: bankData.balance + interest,
        lastInterest: Date.now()
      });
      alert(`Claimed ₹${interest.toLocaleString()} in compound interest.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Imperial Bank</h1>
        <p className="text-royal-muted font-medium">Secure your wealth and let it grow through the power of time.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Account Card */}
          <section className="card-royal bg-royal-primary/5 border-royal-primary/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 text-royal-primary">
                <Landmark size={180} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-royal-bg rounded-2xl border border-white/5 text-royal-primary shadow-xl">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] text-royal-muted font-black uppercase tracking-[0.2em] mb-1">Imperial Savings Account</p>
                        <h2 className="text-3xl font-black text-white">₹{bankData.balance.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-royal-bg rounded-[32px] border border-white/5">
                        <div className="flex items-center gap-3 mb-4 text-royal-success">
                            <TrendingUp size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Growth Rate</span>
                        </div>
                        <p className="text-2xl font-black text-white">1% <span className="text-xs text-royal-muted uppercase">Daily</span></p>
                        <p className="text-[10px] text-royal-muted font-bold mt-1 uppercase tracking-widest">Compounded daily</p>
                    </div>
                    
                    <div className="p-6 bg-royal-bg rounded-[32px] border border-white/5 flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-black text-royal-muted uppercase tracking-widest mb-1">Pending Interest</p>
                            <p className="text-2xl font-black text-royal-success">+₹{calculatePendingInterest().toLocaleString()}</p>
                        </div>
                        <button 
                            onClick={handleClaimInterest}
                            disabled={loading || calculatePendingInterest() <= 0}
                            className="mt-4 text-[10px] font-black text-royal-primary uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                            Claim Interest
                        </button>
                    </div>
                </div>
             </div>
          </section>

          {/* Transaction Section */}
          <section className="card-royal">
             <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <Wallet size={24} className="text-royal-primary" /> Fund Transfers
             </h3>
             
             <div className="space-y-6">
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-muted font-bold">₹</span>
                    <input 
                        type="number" 
                        placeholder="Enter amount..." 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-royal-bg border border-white/5 rounded-[32px] py-6 pl-12 pr-6 text-xl font-black text-white focus:outline-none focus:border-royal-primary/50 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleDeposit}
                        disabled={loading}
                        className="py-5 bg-royal-primary text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-lg shadow-royal-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <ArrowDownCircle size={24} /> Deposit
                    </button>
                    <button 
                        onClick={handleWithdraw}
                        disabled={loading}
                        className="py-5 bg-royal-surface border border-white/10 text-white rounded-[32px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:border-royal-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <ArrowUpCircle size={24} /> Withdraw
                    </button>
                </div>
             </div>
          </section>
        </div>

        <div className="space-y-6">
            <section className="card-royal">
                <h4 className="text-sm font-black text-white mb-6 flex items-center gap-2">
                    <History size={18} className="text-royal-muted" /> Bank Regulations
                </h4>
                <ul className="space-y-4">
                    <li className="flex gap-4">
                        <div className="w-1.5 h-1.5 bg-royal-primary rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs text-royal-muted leading-relaxed font-medium">Interest is calculated based on the time elapsed since your last interest claim or deposit.</p>
                    </li>
                    <li className="flex gap-4">
                        <div className="w-1.5 h-1.5 bg-royal-primary rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs text-royal-muted leading-relaxed font-medium">Deposited funds are safe from underworld activities and market fluctuations.</p>
                    </li>
                    <li className="flex gap-4">
                        <div className="w-1.5 h-1.5 bg-royal-primary rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs text-royal-muted leading-relaxed font-medium">Withdrawals are instantaneous and available at any Imperial Bank branch.</p>
                    </li>
                </ul>
            </section>

            <div className="card-royal bg-royal-bg border-white/5">
                <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-2">Available in Treasury</p>
                <p className="text-xl font-black text-white">₹{(user?.balance || 0).toLocaleString()}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Bank;
