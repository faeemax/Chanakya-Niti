import React, { useState } from 'react';
import { Home, Users, Briefcase, LayoutGrid, LogOut, User, Landmark, TrendingUp, ShieldAlert, ShoppingCart, Send, Trophy, Scroll } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Jobs', icon: Scroll, path: '/jobs' },
    { label: 'Business', icon: Briefcase, path: '/business' },
  ];

  const moreItems = [
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { label: 'Bank', icon: Landmark, path: '/bank' },
    { label: 'Party', icon: Users, path: '/party' },
    { label: 'Market', icon: ShoppingCart, path: '/market' },
    { label: 'Election', icon: Landmark, path: '/election' },
    { label: 'Stock', icon: TrendingUp, path: '/stock' },
    { label: 'Parliament', icon: Landmark, path: '/parliament' },
    { label: 'Transfer', icon: Send, path: '/transfer' },
    { label: 'Crime', icon: ShieldAlert, path: '/crime' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-royal-bg pb-24 md:pb-0 md:pt-20">
      {/* Topbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-royal-surface/80 backdrop-blur-xl border-b border-white/5 z-50 px-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black bg-royal-gradient bg-clip-text text-transparent leading-none">
            CHANAKYA
          </span>
          <span className="text-[10px] md:text-xs tracking-[0.3em] text-royal-muted font-bold">
            NITI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`text-sm font-bold transition-colors ${location.pathname === item.path ? 'text-royal-primary' : 'text-royal-muted hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          <div onClick={() => navigate('/transfer')} className="bg-royal-bg/50 border border-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:border-royal-primary/30 transition-all">
            <span className="text-royal-primary font-black text-sm">₹</span>
            <span className="text-white font-bold text-sm">{(user?.balance || 0).toLocaleString()}</span>
          </div>
          
          <button onClick={logout} className="hidden md:flex p-2 text-royal-muted hover:text-royal-danger transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-royal-surface/90 backdrop-blur-2xl border-t border-white/5 z-50 px-4 h-20 flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === item.path ? 'text-royal-primary' : 'text-royal-muted'}`}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 text-royal-muted`}
        >
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>

      {/* More Menu Drawer */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-royal-surface rounded-t-[40px] z-[70] p-8"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="grid grid-cols-4 gap-6 overflow-y-auto max-h-[60vh] pb-8">
                {moreItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.path);
                      setIsMoreOpen(false);
                    }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="p-4 bg-royal-bg rounded-2xl text-royal-primary border border-white/5">
                      <item.icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-royal-muted">{item.label}</span>
                  </button>
                ))}
                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="p-4 bg-royal-bg rounded-2xl text-royal-danger border border-white/5">
                      <LogOut size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-royal-muted">Logout</span>
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
