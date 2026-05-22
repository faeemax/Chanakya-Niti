import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update, get, onValue, remove, set } from 'firebase/database';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Briefcase, History, Send, X, Check, Search } from 'lucide-react';

const StockMarket = () => {
  const { user, refreshUser } = useAuth();
  const [stocks, setStocks] = useState({});
  const [portfolio, setPortfolio] = useState({});
  const [tradeRequests, setTradeRequests] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeTarget, setTradeTarget] = useState({ user: '', stock: '', qty: 0, price: 0 });

  useEffect(() => {
    const stocksRef = ref(db, 'stocks');
    const unsubscribeStocks = onValue(stocksRef, (snapshot) => {
      if (snapshot.exists()) setStocks(snapshot.val());
    });

    const portfolioRef = ref(db, `portfolios/${user.username}`);
    const unsubscribePortfolio = onValue(portfolioRef, (snapshot) => {
      if (snapshot.exists()) setPortfolio(snapshot.val());
      else setPortfolio({});
    });

    const reqRef = ref(db, `tradeRequests/${user.username}`);
    const unsubscribeReq = onValue(reqRef, (snapshot) => {
      if (snapshot.exists()) setTradeRequests(snapshot.val());
      else setTradeRequests({});
    });

    return () => {
      unsubscribeStocks();
      unsubscribePortfolio();
      unsubscribeReq();
    };
  }, [user.username]);

  const handleFullTrade = async (stockName, action) => {
    if (user.brokerTag !== 'Stock Broker') {
      alert("Only registered Stock Brokers can execute direct exchange trades.");
      return;
    }

    const qtyStr = prompt(`Enter quantity to ${action}:`);
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;

    const currentPrice = stocks[stockName].price;
    const total = qty * currentPrice;

    setLoading(true);
    try {
      const userRef = ref(db, `users/${user.username}`);
      const stockRef = ref(db, `stocks/${stockName}`);
      const portItemRef = ref(db, `portfolios/${user.username}/${stockName}`);
      
      const holding = portfolio[stockName] || { quantity: 0, avgPrice: 0 };

      if (action === 'buy') {
        if (user.balance < total) {
          alert("Insufficient Balance");
          return;
        }
        const newQty = holding.quantity + qty;
        const newAvg = ((holding.quantity * holding.avgPrice) + total) / newQty;
        await set(portItemRef, { quantity: newQty, avgPrice: newAvg });
        await update(userRef, { balance: user.balance - total });
        await update(stockRef, { quantity: (stocks[stockName].quantity || 0) + qty });
      } else {
        if (holding.quantity < qty) {
          alert("Not enough shares");
          return;
        }
        const newQty = holding.quantity - qty;
        if (newQty === 0) await remove(portItemRef);
        else await set(portItemRef, { quantity: newQty, avgPrice: holding.avgPrice });
        await update(userRef, { balance: user.balance + total });
        await update(stockRef, { quantity: Math.max(0, (stocks[stockName].quantity || 0) - qty) });
      }
      refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendTradeOffer = async () => {
    const { user: toUser, stock, qty, price } = tradeTarget;
    if (!toUser || !stock || qty <= 0 || price <= 0) {
      alert("Please fill all fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const targetRef = ref(db, `users/${toUser}`);
      const targetSnap = await get(targetRef);
      if (!targetSnap.exists()) {
        alert("Target user not found.");
        return;
      }

      const holding = portfolio[stock];
      if (!holding || holding.quantity < qty) {
        alert("You do not have enough shares.");
        return;
      }

      const reqId = `req_${Date.now()}`;
      await set(ref(db, `tradeRequests/${toUser}/${reqId}`), {
        from: user.username,
        stock,
        quantity: qty,
        totalPrice: price,
        timestamp: Date.now()
      });

      alert("Trade offer sent successfully.");
      setShowTradeModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const acceptTrade = async (reqId, req) => {
    if (user.balance < req.totalPrice) {
      alert("Insufficient Balance");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if seller still has the shares
      const sellerPortRef = ref(db, `portfolios/${req.from}/${req.stock}`);
      const sellerSnap = await get(sellerPortRef);
      if (!sellerSnap.exists() || sellerSnap.val().quantity < req.quantity) {
        alert("Seller no longer has the required shares.");
        await remove(ref(db, `tradeRequests/${user.username}/${reqId}`));
        return;
      }

      // 2. Execute Transfer
      const buyerUserRef = ref(db, `users/${user.username}`);
      const sellerUserRef = ref(db, `users/${req.from}`);
      const sellerDataSnap = await get(sellerUserRef);
      const sellerData = sellerDataSnap.val();

      // Seller update
      const newSellerQty = sellerSnap.val().quantity - req.quantity;
      if (newSellerQty === 0) await remove(sellerPortRef);
      else await update(sellerPortRef, { quantity: newSellerQty });
      await update(sellerUserRef, { balance: (sellerData.balance || 0) + req.totalPrice });

      // Buyer update
      const buyerPortItemRef = ref(db, `portfolios/${user.username}/${req.stock}`);
      const buyerHolding = portfolio[req.stock] || { quantity: 0, avgPrice: 0 };
      const newBuyerQty = buyerHolding.quantity + req.quantity;
      const newAvg = ((buyerHolding.quantity * buyerHolding.avgPrice) + req.totalPrice) / newBuyerQty;
      await set(buyerPortItemRef, { quantity: newBuyerQty, avgPrice: newAvg });
      await update(buyerUserRef, { balance: user.balance - req.totalPrice });

      // Clean up request
      await remove(ref(db, `tradeRequests/${user.username}/${reqId}`));
      refreshUser();
      alert("Trade executed successfully!");
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
          <h1 className="text-4xl font-black text-white mb-2">Stock Market</h1>
          <p className="text-royal-muted font-medium">Trade shares and build your financial empire.</p>
        </div>
        <button 
          onClick={() => setShowTradeModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Send size={20} /> Send Offer
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market List */}
        <div className="lg:col-span-2 space-y-6">
          <section className="card-royal">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <TrendingUp size={24} className="text-royal-primary" /> Exchange
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-royal-muted" size={16} />
                <input className="bg-royal-bg border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-royal-primary/50 transition-colors" placeholder="Search stocks..." />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-royal-muted uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 pl-2">Ticker</th>
                    <th className="pb-4">Price</th>
                    <th className="pb-4">Volume</th>
                    <th className="pb-4 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(stocks).map(([name, data]) => (
                    <tr key={name} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{name}</span>
                          <span className="text-[10px] text-royal-muted font-medium">Equities Inc.</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">₹{data.price.toLocaleString()}</span>
                          {Math.random() > 0.5 ? (
                            <ArrowUpRight size={14} className="text-royal-success" />
                          ) : (
                            <ArrowDownRight size={14} className="text-royal-danger" />
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-royal-muted font-medium">{data.quantity?.toLocaleString() || 0}</span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleFullTrade(name, 'buy')}
                            className="px-3 py-1.5 bg-royal-primary/10 text-royal-primary rounded-lg text-xs font-bold hover:bg-royal-primary/20 transition-colors"
                          >
                            Buy
                          </button>
                          <button 
                            onClick={() => handleFullTrade(name, 'sell')}
                            className="px-3 py-1.5 bg-royal-surface border border-white/10 text-white rounded-lg text-xs font-bold hover:border-royal-primary/50 transition-colors"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Incoming Requests */}
          {Object.keys(tradeRequests).length > 0 && (
            <section className="card-royal border-royal-primary/20 bg-royal-primary/5">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <History size={24} className="text-royal-primary" /> Incoming Offers
              </h2>
              <div className="space-y-4">
                {Object.entries(tradeRequests).map(([id, req]) => (
                  <div key={id} className="p-4 bg-royal-surface rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-royal-primary uppercase tracking-widest mb-1">From {req.from}</p>
                      <h4 className="text-white font-bold">{req.quantity} {req.stock} @ ₹{req.totalPrice.toLocaleString()}</h4>
                      <p className="text-[10px] text-royal-muted">Sent {new Date(req.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptTrade(id, req)}
                        className="p-3 bg-royal-success/10 text-royal-success rounded-xl border border-royal-success/20 hover:bg-royal-success/20 transition-all"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={async () => await remove(ref(db, `tradeRequests/${user.username}/${id}`))}
                        className="p-3 bg-royal-danger/10 text-royal-danger rounded-xl border border-royal-danger/20 hover:bg-royal-danger/20 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Portfolio Sidebar */}
        <div className="space-y-6">
          <section className="card-royal">
            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3">
              <Briefcase size={24} className="text-royal-secondary" /> Portfolio
            </h2>
            <div className="space-y-6">
              {Object.entries(portfolio).length > 0 ? (
                Object.entries(portfolio).map(([name, data]) => {
                  const currentPrice = stocks[name]?.price || 0;
                  const value = data.quantity * currentPrice;
                  const profit = value - (data.quantity * data.avgPrice);
                  const isProfit = profit >= 0;

                  return (
                    <div key={name} className="group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">{name}</p>
                          <p className="text-[10px] text-royal-muted font-black uppercase tracking-widest">{data.quantity} Shares</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white">₹{value.toLocaleString()}</p>
                          <p className={`text-[10px] font-bold ${isProfit ? 'text-royal-success' : 'text-royal-danger'}`}>
                            {isProfit ? '+' : ''}{profit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="h-1 w-full bg-royal-bg rounded-full overflow-hidden">
                        <div className={`h-full ${isProfit ? 'bg-royal-success' : 'bg-royal-danger'} opacity-30`} style={{ width: '100%' }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-royal-muted font-medium mb-4">Your portfolio is currently a clean slate.</p>
                  <button className="text-xs font-black text-royal-primary uppercase tracking-widest hover:underline">Start Trading</button>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-royal-muted uppercase tracking-widest">Total Value</span>
                <span className="text-xl font-black text-white">
                  ₹{Object.entries(portfolio).reduce((acc, [name, data]) => acc + (data.quantity * (stocks[name]?.price || 0)), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Trade Offer Modal */}
      <AnimatePresence>
        {showTradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTradeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-royal-surface w-full max-w-md rounded-[40px] p-8 border border-white/5 relative z-10"
            >
              <button 
                onClick={() => setShowTradeModal(false)}
                className="absolute top-6 right-6 text-royal-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black text-white mb-6">Send Trade Offer</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Recipient Username</label>
                  <input 
                    type="text" 
                    className="input-royal" 
                    placeholder="Enter strategist name"
                    value={tradeTarget.user}
                    onChange={(e) => setTradeTarget({ ...tradeTarget, user: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Stock</label>
                    <select 
                      className="input-royal"
                      value={tradeTarget.stock}
                      onChange={(e) => setTradeTarget({ ...tradeTarget, stock: e.target.value })}
                    >
                      <option value="">Select</option>
                      {Object.keys(portfolio).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number" 
                      className="input-royal" 
                      placeholder="0"
                      value={tradeTarget.qty}
                      onChange={(e) => setTradeTarget({ ...tradeTarget, qty: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-royal-muted uppercase tracking-widest ml-1">Total Asking Price (₹)</label>
                  <input 
                    type="number" 
                    className="input-royal" 
                    placeholder="Enter total amount"
                    value={tradeTarget.price}
                    onChange={(e) => setTradeTarget({ ...tradeTarget, price: parseInt(e.target.value) })}
                  />
                </div>

                <button 
                  onClick={sendTradeOffer}
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg mt-4"
                >
                  Send Proposal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockMarket;
