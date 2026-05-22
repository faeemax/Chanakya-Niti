import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MARKET_PRICES as BASE_PRICES } from '../constants/gameData';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Package, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Market = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});

  useEffect(() => {
    const marketRef = ref(db, 'market');
    const unsubscribe = onValue(marketRef, (snapshot) => {
      if (snapshot.exists()) {
        setMarketPrices(snapshot.val());
      } else {
        // Fallback to base prices
        const initial = {};
        Object.entries(BASE_PRICES).forEach(([res, price]) => {
          initial[res] = { price, lastChange: 0 };
        });
        setMarketPrices(initial);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSell = async (resource) => {
    const amountStr = prompt(`How many units of ${resource} do you wish to sell?`);
    const amount = parseInt(amountStr);
    
    if (isNaN(amount) || amount <= 0) return;
    
    const inventory = user.inventory || {};
    if ((inventory[resource] || 0) < amount) {
      alert("You lack the required inventory.");
      return;
    }

    setLoading(true);
    try {
      const currentPrice = marketPrices[resource]?.price || BASE_PRICES[resource];
      const earned = amount * currentPrice;
      
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, {
        balance: user.balance + earned,
        [`inventory/${resource}`]: inventory[resource] - amount
      });
      
      refreshUser();
      alert(`Successfully sold ${amount} units for ₹${earned.toLocaleString()}.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Imperial Market</h1>
        <p className="text-royal-muted font-medium">Liquidate your resources for the benefit of the treasury.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(BASE_PRICES).map(([resource, basePrice]) => {
          const liveData = marketPrices[resource] || { price: basePrice, lastChange: 0 };
          const isUp = liveData.lastChange >= 0;

          return (
            <motion.div 
              key={resource}
              whileHover={{ y: -5 }}
              className="card-royal group"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-royal-bg rounded-xl text-royal-primary border border-white/5">
                  <Package size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">Live Rate</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-xl font-black text-white">₹{liveData.price.toLocaleString()}</p>
                    {isUp ? (
                      <ArrowUpRight size={18} className="text-royal-success" />
                    ) : (
                      <ArrowDownRight size={18} className="text-royal-danger" />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-2">{resource}</h3>
              <div className="flex justify-between items-center mb-8">
                <span className="text-sm text-royal-muted font-medium">Your Stock</span>
                <span className="text-lg font-bold text-royal-primary">{(user?.inventory?.[resource] || 0).toLocaleString()}</span>
              </div>

              <button 
                onClick={() => handleSell(resource)}
                disabled={loading}
                className="w-full py-4 bg-royal-surface border border-white/10 group-hover:border-royal-primary/50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Sell Resources <ArrowRight size={18} />
              </button>
            </motion.div>
          );
        })}
      </div>

      <section className="card-royal bg-royal-primary/5 border-royal-primary/10 mt-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-royal-primary/10 rounded-2xl text-royal-primary">
            <TrendingUp size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-1">Market Sentiment</h2>
            <p className="text-sm text-royal-muted leading-relaxed">
              Global demand is shifting. Strategize your production based on live price volatility. High volatility resources like <span className="text-royal-primary font-bold">Saree</span> offer greater risks and rewards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
