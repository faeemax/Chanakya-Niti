import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, update } from 'firebase/database';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Skull, Play, Timer, DollarSign, X, RotateCcw } from 'lucide-react';

const Crime = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showBlackjack, setShowBlackjack] = useState(false);

  // Blackjack State
  const [gameStarted, setGameStarted] = useState(false);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [wager, setWager] = useState(0);
  const [gameMessage, setGameMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);

  const handleIllegalJob = async () => {
    const now = Date.now();
    const lastIllegal = user.lastIllegal || 0;
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - lastIllegal < cooldown) {
      const remaining = cooldown - (now - lastIllegal);
      const hours = Math.ceil(remaining / (60 * 60 * 1000));
      alert(`The heat is still high. Wait another ${hours} hours.`);
      return;
    }

    if (!window.confirm("Attempting an illegal operation. 50% chance of success. Continue?")) return;

    setLoading(true);
    try {
      const success = Math.random() > 0.5;
      const userRef = ref(db, `users/${user.username}`);
      
      let amountChange = 0;
      let message = "";

      if (success) {
        amountChange = Math.floor(Math.random() * (50000 - 10000 + 1) + 10000);
        message = `Success! You earned ₹${amountChange.toLocaleString()} from an underworld operation.`;
      } else {
        amountChange = -Math.floor(Math.random() * (20000 - 10000 + 1) + 10000);
        message = `Busted! You paid ₹${Math.abs(amountChange).toLocaleString()} in bribes/fines.`;
      }

      await update(userRef, {
        balance: (user.balance || 0) + amountChange,
        lastIllegal: now
      });

      refreshUser();
      alert(message);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Blackjack Functions
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let newDeck = [];
    for (let s of suits) {
      for (let v of values) {
        newDeck.push({ suit: s, value: v });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getScore = (hand) => {
    let score = 0;
    let aces = 0;
    for (let card of hand) {
      if (card.value === 'A') {
        aces += 1;
        score += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const startBlackjack = () => {
    const bet = parseInt(prompt("Enter your wager (₹):"));
    if (isNaN(bet) || bet <= 0) return;
    if (user.balance < bet) {
      alert("Insufficient Balance");
      return;
    }

    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];

    setWager(bet);
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPlayerScore(getScore(pHand));
    setDealerScore(getScore(dHand));
    setGameStarted(true);
    setGameOver(false);
    setGameMessage("Your turn, strategist.");
  };

  const hit = () => {
    if (gameOver) return;
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()];
    const score = getScore(newHand);

    setDeck(newDeck);
    setPlayerHand(newHand);
    setPlayerScore(score);

    if (score > 21) {
      endGame('bust');
    }
  };

  const stand = () => {
    if (gameOver) return;
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    let score = getScore(currentDealerHand);

    while (score < 17) {
      currentDealerHand.push(currentDeck.pop());
      score = getScore(currentDealerHand);
    }

    setDealerHand(currentDealerHand);
    setDealerScore(score);
    setDeck(currentDeck);

    if (score > 21 || playerScore > score) {
      endGame('win');
    } else if (score > playerScore) {
      endGame('lose');
    } else {
      endGame('push');
    }
  };

  const endGame = async (result) => {
    setGameOver(true);
    let finalBalance = user.balance;
    let message = "";

    if (result === 'win') {
      finalBalance += wager;
      message = `VICTORY! You won ₹${wager.toLocaleString()}.`;
    } else if (result === 'bust' || result === 'lose') {
      finalBalance -= wager;
      message = result === 'bust' ? `BUST! You exceeded 21. Lost ₹${wager.toLocaleString()}.` : `DEFEAT! The house wins. Lost ₹${wager.toLocaleString()}.`;
    } else {
      message = "PUSH! Your wager has been returned.";
    }

    setGameMessage(message);
    
    try {
      const userRef = ref(db, `users/${user.username}`);
      await update(userRef, { balance: finalBalance });
      refreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setPlayerHand([]);
    setDealerHand([]);
    setGameMessage("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white mb-2">Underworld Dominion</h1>
        <p className="text-royal-muted font-medium">Risk your fortune and reputation in the shadows.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Blackjack Card */}
        <motion.div whileHover={{ y: -5 }} className="card-royal group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-royal-primary">
            <DollarSign size={120} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-royal-bg rounded-xl text-royal-primary border border-white/5">
              <Play size={24} />
            </div>
            <h3 className="text-2xl font-black text-white">Imperial Blackjack</h3>
          </div>
          <p className="text-royal-muted mb-8 text-sm leading-relaxed">
            A classic game of risk. Double your wager or lose it all to the house. High stakes, high rewards.
          </p>
          <button 
            onClick={() => setShowBlackjack(true)}
            className="w-full py-4 bg-royal-surface border border-white/10 group-hover:border-royal-primary/50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            Enter the Casino
          </button>
        </motion.div>

        {/* Illegal Job Card */}
        <motion.div whileHover={{ y: -5 }} className="card-royal group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-royal-danger">
            <Skull size={120} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-royal-bg rounded-xl text-royal-danger border border-white/5">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-2xl font-black text-white">Shadow Operations</h3>
          </div>
          <p className="text-royal-muted mb-8 text-sm leading-relaxed">
            Commit high-risk tasks for quick gains. Be warned: the authorities are always watching. 24h cooldown.
          </p>
          
          {user?.lastIllegal && Date.now() - user.lastIllegal < 24 * 60 * 60 * 1000 ? (
            <div className="w-full py-4 bg-royal-bg border border-transparent text-royal-muted rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
              <Timer size={18} /> Recharging Underworld Connections
            </div>
          ) : (
            <button 
              onClick={handleIllegalJob}
              disabled={loading}
              className="w-full py-4 bg-royal-surface border border-white/10 group-hover:border-royal-danger/50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              Accept Mission
            </button>
          )}
        </motion.div>
      </div>

      {/* Blackjack Modal */}
      <AnimatePresence>
        {showBlackjack && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlackjack(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-royal-surface w-full max-w-4xl rounded-[40px] p-8 border border-white/5 relative z-10"
            >
              <button 
                onClick={() => { setShowBlackjack(false); resetGame(); }}
                className="absolute top-6 right-6 text-royal-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {!gameStarted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex p-4 bg-royal-primary/10 rounded-full text-royal-primary mb-4">
                    <Play size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-white">Blackjack Table</h2>
                  <p className="text-royal-muted max-w-sm mx-auto font-medium">
                    The cards are being shuffled by the house. Prepare your wager for the next round of Imperial Blackjack.
                  </p>
                  <div className="pt-8">
                     <button onClick={startBlackjack} className="btn-primary px-12">Place Wager & Start</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 py-6">
                  {/* Dealer Section */}
                  <div className="text-center space-y-4">
                    <p className="text-[10px] text-royal-muted font-black uppercase tracking-[0.3em]">Imperial Dealer</p>
                    <div className="flex justify-center gap-4">
                      {dealerHand.map((card, i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-24 h-36 bg-white rounded-xl flex items-center justify-center text-3xl font-black shadow-lg"
                        >
                          {!gameOver && i === 1 ? (
                            <div className="w-full h-full bg-royal-primary rounded-xl border-4 border-white flex items-center justify-center text-white">
                              ?
                            </div>
                          ) : (
                            <span className={['♥', '♦'].includes(card.suit) ? 'text-royal-danger' : 'text-royal-bg'}>
                              {card.value}{card.suit}
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {gameOver && <p className="text-xl font-black text-white">Score: {dealerScore}</p>}
                  </div>

                  {/* Game Message */}
                  <div className="text-center">
                    <motion.p 
                      key={gameMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-black bg-royal-gradient bg-clip-text text-transparent"
                    >
                      {gameMessage}
                    </motion.p>
                    <p className="text-xs text-royal-muted font-bold mt-2 uppercase tracking-widest">Wager: ₹{wager.toLocaleString()}</p>
                  </div>

                  {/* Player Section */}
                  <div className="text-center space-y-4">
                    <div className="flex justify-center gap-4">
                      {playerHand.map((card, i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-24 h-36 bg-white rounded-xl flex items-center justify-center text-3xl font-black shadow-lg"
                        >
                          <span className={['♥', '♦'].includes(card.suit) ? 'text-royal-danger' : 'text-royal-bg'}>
                            {card.value}{card.suit}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-xl font-black text-white">Your Score: {playerScore}</p>
                    <p className="text-[10px] text-royal-muted font-black uppercase tracking-[0.3em]">{user.username}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-4">
                    {!gameOver ? (
                      <>
                        <button onClick={hit} className="px-10 py-4 bg-royal-primary text-white rounded-2xl font-black hover:scale-105 transition-all">HIT</button>
                        <button onClick={stand} className="px-10 py-4 bg-royal-surface border border-white/10 text-white rounded-2xl font-black hover:border-royal-primary transition-all">STAND</button>
                      </>
                    ) : (
                      <button onClick={resetGame} className="btn-primary flex items-center gap-2">
                        <RotateCcw size={20} /> Play Again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Crime;
