import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ref, get, update } from 'firebase/database';
import { db } from './services/firebase';
import { SECTORS } from './constants/gameData';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Business from './pages/Business';
import Party from './pages/Party';
import Market from './pages/Market';
import Election from './pages/Election';
import StockMarket from './pages/StockMarket';
import Crime from './pages/Crime';
import Profile from './pages/Profile';
import Parliament from './pages/Parliament';
import Transfer from './pages/Transfer';
import Leaderboard from './pages/Leaderboard';
import Bank from './pages/Bank';
import Jobs from './pages/Jobs';
import IntroCanvas from './components/IntroCanvas';
import { AnimatePresence } from 'framer-motion';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-royal-bg flex items-center justify-center text-royal-primary font-black tracking-widest">LOADING DOMINION...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppContent() {
  const [showIntro, setShowIntro] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (!hasSeenIntro) {
      setShowIntro(true);
      sessionStorage.setItem('hasSeenIntro', 'true');
    }

    // Global Market & Stock Simulation
    const globalInterval = setInterval(async () => {
      try {
        const stocksRef = ref(db, 'stocks');
        const marketRef = ref(db, 'market');
        
        // 1. Update Stocks
        const stockSnap = await get(stocksRef);
        const updates = {};
        if (stockSnap.exists()) {
          const stocks = stockSnap.val();
          Object.keys(stocks).forEach(name => {
            const currentPrice = stocks[name].price;
            const change = (Math.random() - 0.5) * 10;
            updates[`stocks/${name}/price`] = Math.max(10, Math.floor(currentPrice + change));
          });
        }

        // 2. Update Market Resources
        const marketSnap = await get(marketRef);
        const basePrices = { Timber: 120, Silk: 280, Saree: 540 };
        if (marketSnap.exists()) {
          const market = marketSnap.val();
          Object.keys(basePrices).forEach(res => {
            const currentPrice = market[res]?.price || basePrices[res];
            const volatility = res === 'Saree' ? 25 : res === 'Silk' ? 15 : 8;
            const change = (Math.random() - 0.5) * volatility;
            const newPrice = Math.max(basePrices[res] * 0.5, Math.floor(currentPrice + change));
            updates[`market/${res}/price`] = Math.min(basePrices[res] * 2, newPrice);
            updates[`market/${res}/lastChange`] = change;
          });
        } else {
          Object.keys(basePrices).forEach(res => {
            updates[`market/${res}/price`] = basePrices[res];
            updates[`market/${res}/lastChange`] = 0;
          });
        }

        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      } catch (e) {
        console.error("Global update failed", e);
      }
    }, 60000);

    return () => clearInterval(globalInterval);
  }, []);

  // Business Automation (User Specific)
  useEffect(() => {
    if (!user || !user.businesses) return;

    const automationInterval = setInterval(async () => {
      try {
        const bizUpdates = {};
        let shouldUpdate = false;

        Object.entries(user.businesses).forEach(([id, biz]) => {
          if (biz.hasManager && Date.now() >= (biz.nextCollect || 0)) {
            const sector = SECTORS.find(s => s.id === id);
            if (sector) {
              const amount = (biz.factories || 1) * sector.production;
              const currentQty = (user.inventory && user.inventory[sector.resource]) || 0;
              
              bizUpdates[`users/${user.username}/inventory/${sector.resource}`] = currentQty + amount;
              bizUpdates[`users/${user.username}/businesses/${id}/nextCollect`] = Date.now() + (60 * 60 * 1000);
              shouldUpdate = true;
            }
          }
        });

        if (shouldUpdate) {
          await update(ref(db), bizUpdates);
          refreshUser();
        }
      } catch (e) {
        console.error("Automation failed", e);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(automationInterval);
  }, [user, refreshUser]);

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroCanvas onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/business" element={
          <ProtectedRoute>
            <MainLayout>
              <Business />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/party" element={
          <ProtectedRoute>
            <MainLayout>
              <Party />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/market" element={
          <ProtectedRoute>
            <MainLayout>
              <Market />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/election" element={
          <ProtectedRoute>
            <MainLayout>
              <Election />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute>
            <MainLayout>
              <StockMarket />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/crime" element={
          <ProtectedRoute>
            <MainLayout>
              <Crime />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/parliament" element={
          <ProtectedRoute>
            <MainLayout>
              <Parliament />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/transfer" element={
          <ProtectedRoute>
            <MainLayout>
              <Transfer />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Leaderboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/bank" element={
          <ProtectedRoute>
            <MainLayout>
              <Bank />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute>
            <MainLayout>
              <Jobs />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/Chanakya-Niti">
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
