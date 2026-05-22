import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-royal-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-royal-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-royal-secondary/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-royal-surface rounded-3xl border border-white/5 mb-6 text-royal-primary">
            <Shield size={48} />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Chanakya Niti</h1>
          <p className="text-royal-muted font-medium">The Empire Awaits Your Command.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-royal space-y-6">
          {error && (
            <div className="p-4 bg-royal-danger/10 border border-royal-danger/20 rounded-2xl text-royal-danger text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-royal-muted uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-muted" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-royal pl-12" 
                placeholder="The Strategist"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-royal-muted uppercase tracking-widest ml-1">Passphrase</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-muted" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-royal pl-12" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-lg">
            Enter the Dominion
          </button>
        </form>

        <p className="text-center mt-8 text-royal-muted text-sm font-medium">
          New to the game? <span onClick={() => navigate('/signup')} className="text-royal-primary font-bold cursor-pointer hover:underline">Establish a Legacy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
