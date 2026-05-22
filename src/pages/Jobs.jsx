import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { Briefcase, Landmark, Scroll, ShieldCheck, Timer, Coins, ChevronRight } from 'lucide-react';

const JOBS = [
  { id: 'clerk', title: 'Imperial Clerk', pay: 1500, cooldown: 5 * 60 * 1000, desc: 'Manage official documents and records in the state capital.', icon: Scroll },
  { id: 'tax', title: 'Tax Collector', pay: 3500, cooldown: 15 * 60 * 1000, desc: 'Collect dues from the local markets for the Imperial Treasury.', icon: Coins },
  { id: 'guard', title: 'Palace Guard', pay: 8000, cooldown: 45 * 60 * 1000, desc: 'Protect the inner sanctum of the dominion from invaders.', icon: ShieldCheck },
  { id: 'scribe', title: 'Royal Scribe', pay: 15000, cooldown: 120 * 60 * 1000, desc: 'Draft the decrees of the High Council and preserve history.', icon: Landmark }
];

const Jobs = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jobCooldowns, setJobCooldowns] = useState({});

  useEffect(() => {
    if (!user) return;
    const cooldownRef = ref(db, `jobCooldowns/${user.username}`);
    const unsubscribe = onValue(cooldownRef, (snapshot) => {
      if (snapshot.exists()) setJobCooldowns(snapshot.val());
    });
    return () => unsubscribe();
  }, [user]);

  const handleWork = async (job) => {
    const now = Date.now();
    const lastWork = jobCooldowns[job.id] || 0;
    
    if (now - lastWork < job.cooldown) {
      alert("You are exhausted from your previous duties. Rest a while.");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      const cooldownRef = ref(db, `jobCooldowns/${user.username}`);
      
      await update(userRef, { balance: (user.balance || 0) + job.pay });
      await update(cooldownRef, { [job.id]: now });
      
      refreshUser();
      alert(`Duty fulfilled! You earned ₹${job.pay.toLocaleString()} from your service as a ${job.title}.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (jobId, cooldown) => {
    const lastWork = jobCooldowns[jobId] || 0;
    const remaining = cooldown - (Date.now() - lastWork);
    if (remaining <= 0) return null;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Imperial Careers</h1>
        <p className="text-royal-muted font-medium">Serve the dominion through honest labor and earn your keep.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {JOBS.map((job) => {
          const timeLeft = getRemainingTime(job.id, job.cooldown);
          const isAvailable = !timeLeft;

          return (
            <motion.div 
              key={job.id}
              whileHover={{ y: -5 }}
              className={`card-royal group relative overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 bg-royal-bg rounded-2xl border border-white/5 ${isAvailable ? 'text-royal-primary' : 'text-royal-muted'}`}>
                  <job.icon size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">{job.title}</h3>
                    <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">Imperial Civil Service</p>
                </div>
              </div>

              <p className="text-sm text-royal-muted mb-8 leading-relaxed">
                {job.desc}
              </p>

              <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Stipend</p>
                    <p className="text-xl font-black text-white">₹{job.pay.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest mb-1">Service Time</p>
                    <p className="text-sm font-bold text-white">{(job.cooldown / 60000)} Minutes</p>
                </div>
              </div>

              {isAvailable ? (
                <button 
                  onClick={() => handleWork(job)}
                  disabled={loading}
                  className="w-full py-4 bg-royal-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-royal-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Apply for Duty <ChevronRight size={18} />
                </button>
              ) : (
                <div className="w-full py-4 bg-royal-bg border border-transparent text-royal-muted rounded-2xl font-bold flex items-center justify-center gap-2">
                  <Timer size={18} /> Available in {timeLeft}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <section className="card-royal bg-royal-primary/5 border-royal-primary/10 mt-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-royal-primary/10 rounded-2xl text-royal-primary">
            <Briefcase size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-1">Career Guidance</h2>
            <p className="text-sm text-royal-muted leading-relaxed">
              Higher-tier jobs require more dedication but offer substantial rewards. Balance your active service with passive business ventures for maximum growth.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jobs;
