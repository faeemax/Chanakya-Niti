import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SECTORS } from '../constants/gameData';
import { ref, update, get } from 'firebase/database';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Plus, Zap, Package, X, Boxes, Users } from 'lucide-react';

const Business = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const businesses = user?.businesses || {};

  const handleCreateBusiness = async (sector) => {
    if (user.balance < (sector.setup + sector.factoryCost)) {
      alert("Insufficient Balance");
      return;
    }

    setLoading(true);
    try {
      const bizName = prompt(`Enter a name for your ${sector.name} business:`);
      if (!bizName) return;

      const newBiz = {
        name: bizName,
        location: "National",
        factories: 1,
        resource: sector.resource,
        nextCollect: 0
      };

      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: user.balance - (sector.setup + sector.factoryCost),
        [`businesses/${sector.id}`]: newBiz
      });
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (sectorId) => {
    const sector = SECTORS.find(s => s.id === sectorId);
    if (user.balance < sector.factoryCost) {
      alert("Insufficient Balance");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: user.balance - sector.factoryCost,
        [`businesses/${sectorId}/factories`]: (businesses[sectorId].factories || 0) + 1
      });
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (sectorId) => {
    const biz = businesses[sectorId];
    const sector = SECTORS.find(s => s.id === sectorId);
    
    if (Date.now() < (biz.nextCollect || 0)) {
      alert("Production not ready yet");
      return;
    }

    setLoading(true);
    try {
      const amount = biz.factories * sector.production;
      const userRef = ref(db, `users/${user.username}`);
      
      const currentInventory = user.inventory || {};
      const newInventory = {
        ...currentInventory,
        [sector.resource]: (currentInventory[sector.resource] || 0) + amount
      };

      await update(userRef, {
        inventory: newInventory,
        [`businesses/${sectorId}/nextCollect`]: Date.now() + (60 * 60 * 1000)
      });
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleHireManager = async (sectorId) => {
    const COST = 250000;
    if (user.balance < COST) {
      alert("Insufficient Balance (₹250,000 required)");
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: user.balance - COST,
        [`businesses/${sectorId}/hasManager`]: true
      });
      refreshUser();
      alert("Imperial Manager hired! Production will now be automated.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Business Empire</h1>
          <p className="text-royal-muted font-medium">Industrialize your domain and amass resources.</p>
        </div>
        <button 
          onClick={() => setShowInventory(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Package size={20} /> Inventory
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SECTORS.map((sector) => {
          const biz = businesses[sector.id];
          const isReady = biz && Date.now() >= (biz.nextCollect || 0);

          return (
            <motion.div 
              key={sector.id}
              whileHover={{ y: -5 }}
              className="card-royal relative overflow-hidden"
            >
              {biz && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-royal-primary/10 rounded-full text-[10px] font-black text-royal-primary uppercase tracking-widest">
                  Active
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-royal-bg rounded-xl text-royal-secondary border border-white/5">
                  <Factory size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">{sector.name}</h3>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-royal-muted font-medium">Resource</span>
                  <span className="text-white font-bold">{sector.resource}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-royal-muted font-medium">Production</span>
                  <span className="text-white font-bold">{sector.production} units/hr</span>
                </div>
                {!biz && (
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-muted font-medium">Establishment Fee</span>
                    <span className="text-royal-primary font-bold">₹{(sector.setup + sector.factoryCost).toLocaleString()}</span>
                  </div>
                )}
                {biz && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-muted font-medium">Factories</span>
                      <span className="text-royal-primary font-bold">{biz.factories}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-muted font-medium">Expansion Fee</span>
                      <span className="text-royal-secondary font-bold">₹{sector.factoryCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-muted font-medium">Automation</span>
                      <span className={`font-bold ${biz.hasManager ? 'text-royal-success' : 'text-royal-danger'}`}>
                        {biz.hasManager ? 'Active' : 'Manual'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {biz ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleCollect(sector.id)}
                      disabled={!isReady || loading || biz.hasManager}
                      className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isReady && !biz.hasManager ? 'bg-royal-success text-white' : 'bg-royal-bg text-royal-muted cursor-not-allowed'}`}
                    >
                      <Zap size={16} /> {biz.hasManager ? 'Auto' : 'Collect'}
                    </button>
                    <button 
                      onClick={() => handleUpgrade(sector.id)}
                      disabled={loading}
                      className="py-3 bg-royal-surface border border-white/10 hover:border-royal-primary/50 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Upgrade
                    </button>
                  </div>
                  
                  {!biz.hasManager && (
                    <button 
                      onClick={() => handleHireManager(sector.id)}
                      disabled={loading}
                      className="w-full py-3 bg-royal-primary/5 border border-royal-primary/20 text-royal-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-royal-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Users size={14} /> Hire Imperial Manager (₹250k)
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => handleCreateBusiness(sector)}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Establish Business
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInventory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-royal-surface w-full max-w-lg rounded-[40px] p-8 border border-white/5 relative z-10"
            >
              <button 
                onClick={() => setShowInventory(false)}
                className="absolute top-6 right-6 text-royal-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <Boxes size={28} className="text-royal-primary" /> Imperial Stockpile
              </h2>

              <div className="space-y-4">
                {Object.keys(user?.inventory || {}).length > 0 ? (
                  Object.entries(user.inventory).map(([res, qty]) => (
                    <div key={res} className="p-4 bg-royal-bg rounded-2xl border border-white/5 flex justify-between items-center group hover:border-royal-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-royal-surface rounded-lg text-royal-muted group-hover:text-royal-primary transition-colors">
                            <Package size={18} />
                         </div>
                         <span className="font-bold text-white">{res}</span>
                      </div>
                      <span className="text-xl font-black text-royal-primary">{qty.toLocaleString()} <span className="text-[10px] text-royal-muted uppercase">Units</span></span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                     <p className="text-royal-muted font-medium italic">Your inventory is currently empty. Start production.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                 <p className="text-[10px] text-royal-muted font-black uppercase tracking-[0.2em]">Manage your assets through the Imperial Market</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Business;
