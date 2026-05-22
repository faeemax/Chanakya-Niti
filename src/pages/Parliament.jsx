import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RS_SEATS_PER_STATE } from '../constants/gameData';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { Landmark, PieChart, Users, Map } from 'lucide-react';

const Parliament = () => {
  const { user } = useAuth();
  const [nationalStats, setNationalStats] = useState({});
  const [rsStats, setRsStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statsRef = ref(db, 'nationalStats');
    const unsubscribeNational = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) setNationalStats(snapshot.val());
    });

    const rsRef = ref(db, 'rajyaSabha');
    const unsubscribeRs = onValue(rsRef, (snapshot) => {
      if (snapshot.exists()) setRsStats(snapshot.val());
      setLoading(false);
    });

    return () => {
      unsubscribeNational();
      unsubscribeRs();
    };
  }, []);

  const totalLSSeats = Object.values(nationalStats).reduce((acc, curr) => acc + (curr.seats || 0), 0);
  const totalRSSeats = Object.values(RS_SEATS_PER_STATE).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Central Parliament</h1>
        <p className="text-royal-muted font-medium">The pinnacle of the dominion's political architecture.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lok Sabha - National Strength */}
        <section className="card-royal">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Landmark size={28} className="text-royal-primary" /> Lok Sabha
            </h2>
            <div className="px-4 py-1.5 bg-royal-primary/10 rounded-full border border-royal-primary/20 text-xs font-black text-royal-primary uppercase tracking-widest">
              Lower House
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(nationalStats).length > 0 ? (
              Object.entries(nationalStats).sort((a, b) => (b[1].seats || 0) - (a[1].seats || 0)).map(([party, data]) => {
                const percentage = ((data.seats || 0) / totalLSSeats) * 100;
                return (
                  <div key={party} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-white font-bold">{party}</span>
                        <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">{data.seats || 0} Seats</p>
                      </div>
                      <span className="text-sm font-black text-royal-primary">{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-2 w-full bg-royal-bg rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-royal-primary"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 opacity-20">
                <PieChart size={64} className="mx-auto mb-4" />
                <p className="font-bold">Awaiting National Census</p>
              </div>
            )}
          </div>
          
          <div className="mt-12 p-6 bg-royal-bg rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-royal-muted font-bold text-sm italic">"The voice of the people is the absolute authority."</span>
            <div className="text-right">
              <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">Total Strength</p>
              <p className="text-xl font-black text-white">543 Seats</p>
            </div>
          </div>
        </section>

        {/* Rajya Sabha - State Representation */}
        <section className="card-royal">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Users size={28} className="text-royal-secondary" /> Rajya Sabha
            </h2>
            <div className="px-4 py-1.5 bg-royal-secondary/10 rounded-full border border-royal-secondary/20 text-xs font-black text-royal-secondary uppercase tracking-widest">
              Upper House
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(RS_SEATS_PER_STATE).map(([state, maxSeats]) => {
              const occupants = rsStats[state] || {};
              const occupiedCount = Object.keys(occupants).length;
              
              return (
                <div key={state} className="p-4 bg-royal-bg rounded-2xl border border-white/5 group hover:border-royal-secondary/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-royal-surface rounded-lg text-royal-secondary border border-white/5">
                      <Map size={16} />
                    </div>
                    <span className="text-[10px] font-black text-royal-muted uppercase tracking-widest">{occupiedCount}/{maxSeats} Filled</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">{state}</h4>
                  <div className="flex gap-1">
                    {Array.from({ length: maxSeats }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full ${i < occupiedCount ? 'bg-royal-secondary' : 'bg-royal-surface opacity-30'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-royal-bg rounded-2xl border border-white/5">
             <h4 className="text-xs font-black text-royal-muted uppercase tracking-widest mb-4">Current Incumbents</h4>
             <div className="flex flex-wrap gap-2">
                {Object.entries(rsStats).flatMap(([state, occupants]) => 
                  Object.entries(occupants).map(([party, username]) => (
                    <div key={`${state}-${username}`} className="px-3 py-1 bg-royal-surface rounded-full border border-white/5 text-[10px] font-bold text-white flex items-center gap-2">
                       <span className="text-royal-secondary">{party}</span> {username}
                    </div>
                  ))
                ).slice(0, 8)}
                {Object.keys(rsStats).length === 0 && <p className="text-xs text-royal-muted italic">No representatives currently seated.</p>}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Parliament;
