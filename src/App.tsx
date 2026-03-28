/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Users, 
  User, 
  Search, 
  Plus, 
  Navigation, 
  AlertTriangle, 
  Share2, 
  MessageSquare, 
  Flashlight, 
  Bot, 
  SkipBack, 
  Play, 
  SkipForward, 
  Volume2,
  ChevronLeft,
  Trophy,
  Settings,
  Bike,
  Fuel,
  MapPin,
  Clock,
  Award,
  Calendar,
  X,
  TrendingUp,
  Lightbulb,
  LogOut,
  Pause
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  orderBy, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  GoogleMap, 
  useJsApiLoader, 
  DirectionsRenderer, 
  Marker, 
  InfoWindow,
  Libraries
} from '@react-google-maps/api';
import { 
  Screen, 
  RiderProfile, 
  MOCK_DESTINATIONS, 
  MOCK_LEADERBOARD, 
  MOCK_RIDERS,
  Ride,
  Expense,
  LiveRide,
  Friendship
} from './types';
import { getAIPillionAdvice, NavigationAdvice } from './services/geminiService';

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const LIBRARIES: Libraries = ["places"];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'ride' | 'community' | 'profile'>('ride');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as RiderProfile);
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('onboarding');
        }
      } else {
        if (currentScreen !== 'splash') {
          setCurrentScreen('auth');
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        if (isAuthReady) {
          if (user) {
            if (profile) setCurrentScreen('dashboard');
            else setCurrentScreen('onboarding');
          } else {
            setCurrentScreen('auth');
          }
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, isAuthReady, user, profile]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleStartRiding = async (data: Partial<RiderProfile>) => {
    if (!user) return;
    const newProfile: RiderProfile = {
      uid: user.uid,
      name: data.name || '',
      bike: data.bike || '',
      mileage: data.mileage || '',
      points: 0,
      ridesCount: 0,
      totalDistance: 0,
      rank: 'Scout',
      memberSince: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScreen('auth');
  };

  if (!isAuthReady && currentScreen === 'splash') {
    return <SplashScreen />;
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-dark-bg relative overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {currentScreen === 'splash' && <SplashScreen key="splash" />}
        {currentScreen === 'auth' && <AuthScreen onLogin={handleLogin} />}
        {currentScreen === 'onboarding' && <OnboardingScreen onComplete={handleStartRiding} />}
        {currentScreen === 'dashboard' && profile && (
          <DashboardScreen 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onStartRide={() => setCurrentScreen('navigation')}
            setSelectedDestination={setSelectedDestination}
            profile={profile}
            onLogout={handleLogout}
          />
        )}
        {currentScreen === 'navigation' && profile && (
          <NavigationScreen 
            onExit={() => setCurrentScreen('dashboard')} 
            profile={profile} 
            destination={selectedDestination}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 bg-grid"
    >
      <div className="w-24 h-24 bg-brand-orange rounded-3xl flex items-center justify-center shadow-lg shadow-brand-orange/20 mb-8">
        <Navigation className="text-white w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">MotoMate</h1>
      <p className="text-gray-400 text-center mb-12">Your ultimate AI-powered riding companion.</p>
      
      <button 
        onClick={onLogin}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors active:scale-95"
      >
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
        Continue with Google
      </button>
    </motion.div>
  );
}

function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-dark-bg flex flex-col items-center justify-center bg-carbon"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-24 h-24 bg-brand-orange rounded-3xl flex items-center justify-center orange-glow mb-6">
          <Bike size={48} className="text-white" />
        </div>
        <div className="absolute -inset-4 bg-brand-orange/20 blur-2xl rounded-full -z-10 animate-pulse" />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-bold tracking-tight mb-2"
      >
        <span className="text-brand-orange">Moto</span>Mate
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-400 text-sm tracking-[0.2em] uppercase"
      >
        Ride Smart, Ride Safe
      </motion.p>

      <div className="mt-24 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-brand-orange"
          />
        ))}
      </div>
    </motion.div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: (data: Partial<RiderProfile>) => void }) {
  const [name, setName] = useState('');
  const [bike, setBike] = useState('');
  const [mileage, setMileage] = useState('');

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      className="flex-1 p-8 flex flex-col bg-carbon"
    >
      <div className="mt-12 mb-12">
        <h2 className="text-4xl font-bold mb-2">Welcome, Rider! 🏍️</h2>
        <p className="text-gray-400">Let's get you set up for your journey</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={20} />
            <input 
              type="text" 
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-card-bg border-none rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Bike</label>
          <div className="relative">
            <Bike className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={20} />
            <input 
              type="text" 
              placeholder="e.g., Royal Enfield Himalayan"
              value={bike}
              onChange={(e) => setBike(e.target.value)}
              className="w-full bg-card-bg border-none rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Mileage</label>
          <div className="relative">
            <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={20} />
            <input 
              type="text" 
              placeholder="km/l"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full bg-card-bg border-none rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button 
          onClick={() => onComplete({ name, bike, mileage })}
          disabled={!name || !bike}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-orange to-red-500 text-white font-bold text-lg shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50"
        >
          Start Riding 🏍️
        </button>
      </div>
    </motion.div>
  );
}

function ExpenseTrackingModal({ onClose, uid }: { onClose: () => void, uid: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [type, setType] = useState<Expense['type']>('Fuel');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'expenses'), where('uid', '==', uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });
    return () => unsubscribe();
  }, [uid]);

  const handleAdd = async () => {
    if (!amount) return;
    await addDoc(collection(db, 'expenses'), {
      uid,
      type,
      amount: parseFloat(amount),
      date: serverTimestamp(),
      note
    });
    setAmount('');
    setNote('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="bg-card-bg w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-gray-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Expense Tracker</h2>
          <button onClick={onClose} className="p-2 bg-gray-800 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            {(['Fuel', 'Maintenance', 'Gear', 'Other'] as const).map(t => (
              <button 
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${type === t ? 'bg-brand-orange text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <input 
            type="number" placeholder="Amount (₹)" 
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white"
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          <input 
            type="text" placeholder="Note (optional)" 
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white"
            value={note} onChange={e => setNote(e.target.value)}
          />
          <button onClick={handleAdd} className="w-full bg-brand-orange text-white font-bold py-3 rounded-xl">ADD EXPENSE</button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-3">
          {expenses.map(exp => (
            <div key={exp.id} className="flex justify-between items-center p-3 bg-gray-900 rounded-xl border border-gray-800">
              <div>
                <p className="text-white font-bold">{exp.type}</p>
                <p className="text-xs text-gray-500">{exp.note || 'No note'}</p>
              </div>
              <p className="text-brand-orange font-bold">₹{exp.amount}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function RideUploadModal({ onClose, uid, currentPoints }: { onClose: () => void, uid: string, currentPoints: number }) {
  const [dest, setDest] = useState('');
  const [dist, setDist] = useState('');
  const [dur, setDur] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!dest || !dist || isUploading) return;
    setIsUploading(true);
    try {
      const distance = parseInt(dist);
      await addDoc(collection(db, 'rides'), {
        uid,
        destination: dest,
        distance,
        duration: dur,
        timestamp: serverTimestamp()
      });

      // Update user points and ride count
      const newPoints = currentPoints + 50;
      let newRank = 'Scout';
      if (newPoints >= 10000) newRank = 'Legend';
      else if (newPoints >= 5000) newRank = 'Voyager';
      else if (newPoints >= 1000) newRank = 'Pathfinder';

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        await updateDoc(userRef, {
          points: newPoints,
          ridesCount: (userData.ridesCount || 0) + 1,
          totalDistance: (userData.totalDistance || 0) + distance,
          rank: newRank
        });
      }

      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card-bg w-full max-w-md rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange" />
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Log New Ride</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Destination</label>
            <input 
              type="text" placeholder="Where did you go?" 
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
              value={dest} onChange={e => setDest(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Distance (km)</label>
              <input 
                type="number" placeholder="0" 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
                value={dist} onChange={e => setDist(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Duration</label>
              <input 
                type="text" placeholder="e.g. 2h 30m" 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-2 focus:ring-brand-orange transition-all"
                value={dur} onChange={e => setDur(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-brand-orange/10 p-4 rounded-2xl border border-brand-orange/20 flex items-center gap-3">
            <Award className="text-brand-orange" size={20} />
            <p className="text-xs text-brand-orange font-bold uppercase tracking-widest">You'll earn +50 PTS for this ride!</p>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={!dest || !dist || isUploading}
            className="w-full bg-brand-orange text-white font-black py-5 rounded-2xl shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {isUploading ? 'UPLOADING...' : 'CONFIRM & LOG RIDE'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RankDetailsModal({ onClose, profile }: { onClose: () => void, profile: RiderProfile }) {
  const ranks = [
    { name: 'Scout', minPoints: 0, icon: MapPin, color: 'text-blue-400' },
    { name: 'Pathfinder', minPoints: 1000, icon: TrendingUp, color: 'text-green-400' },
    { name: 'Voyager', minPoints: 5000, icon: Award, color: 'text-purple-400' },
    { name: 'Legend', minPoints: 10000, icon: Trophy, color: 'text-brand-orange' },
  ];

  const currentRankIndex = ranks.findIndex(r => r.name === profile.rank);
  const nextRank = ranks[currentRankIndex + 1];
  const progress = nextRank ? (profile.points / nextRank.minPoints) * 100 : 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card-bg w-full max-w-md rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange" />
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Rider Status</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center mb-4 relative">
            <Trophy className="text-brand-orange" size={48} />
            <div className="absolute -bottom-2 bg-brand-orange text-black font-black text-[10px] px-3 py-1 rounded-full uppercase italic tracking-tighter">
              {profile.rank}
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-[250px] mx-auto">
            You are a <span className="text-white font-bold">{profile.rank}</span>. 
            {nextRank ? ` Earn ${nextRank.minPoints - profile.points} more points to become a ${nextRank.name}!` : " You've reached the top rank!"}
          </p>
        </div>
        
        <div className="space-y-2 mb-8">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span>Progress to {nextRank?.name || 'Max Rank'}</span>
            <span className="text-brand-orange">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-brand-orange h-full orange-glow" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-left">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Points</p>
            <p className="text-2xl font-black text-white italic tracking-tighter">{profile.points}</p>
          </div>
          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-left">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Rides Logged</p>
            <p className="text-2xl font-black text-white italic tracking-tighter">{profile.ridesCount}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 text-left">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">How to earn points</h4>
          <ul className="space-y-3">
            {[
              { label: 'Log a Ride', pts: '+50 pts' },
              { label: 'Join Group Ride', pts: '+100 pts' },
              { label: 'Complete Challenge', pts: '+200 pts' },
            ].map((item, i) => (
              <li key={i} className="flex justify-between items-center">
                <span className="text-xs text-gray-300 font-bold uppercase tracking-widest">{item.label}</span>
                <span className="text-xs text-brand-orange font-black italic">{item.pts}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onClose} className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95">
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}

function LiveTrackingModal({ ride, onClose }: { ride: LiveRide, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-card-bg rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-[80vh]"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Tracking {ride.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 bg-gray-900 rounded-[32px] relative overflow-hidden mb-6 border border-white/5">
          {/* Mock Map */}
          <div className="absolute inset-0 opacity-40">
            <svg width="100%" height="100%" viewBox="0 0 400 800">
              <path 
                d="M 200 800 Q 250 600 200 400 T 200 0" 
                fill="none" 
                stroke="#FF6321" 
                strokeWidth="4" 
                strokeDasharray="8 8"
              />
              <circle cx="200" cy="400" r="12" fill="white" stroke="#FF6321" strokeWidth="4" className="animate-pulse" />
            </svg>
          </div>
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-white">
                <Navigation size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Location</p>
                <p className="text-sm font-bold text-white">NH 48, Near Lonavala</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Destination</p>
              <p className="text-sm font-bold text-white">{ride.destination}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-bold text-green-500 uppercase tracking-tighter italic">{ride.status}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
          >
            Close Tracking
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LiveRidesSection({ uid }: { uid: string }) {
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [trackingRide, setTrackingRide] = useState<LiveRide | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'live_rides'), where('sharingWith', 'array-contains', uid), where('status', '==', 'Riding'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLiveRides(snapshot.docs.map(doc => doc.data() as LiveRide));
    });
    return () => unsubscribe();
  }, [uid]);

  if (liveRides.length === 0) return null;

  return (
    <section>
      <AnimatePresence>
        {trackingRide && <LiveTrackingModal ride={trackingRide} onClose={() => setTrackingRide(null)} />}
      </AnimatePresence>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
          Live Rides <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </h3>
      </div>
      <div className="space-y-4">
        {liveRides.map((ride, i) => (
          <div key={i} className="bg-white/5 rounded-[32px] p-6 border border-brand-orange/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                Live
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                <User size={24} />
              </div>
              <div>
                <h4 className="font-black text-white uppercase italic tracking-tighter">{ride.name}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">En route to {ride.destination}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-brand-orange" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Location Shared</span>
              </div>
              <button 
                onClick={() => setTrackingRide(ride)}
                className="bg-brand-orange px-4 py-2 rounded-full text-[10px] font-black text-white uppercase shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
              >
                Track
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AddFriendModal({ uid, onClose }: { uid: string, onClose: () => void }) {
  const [targetUid, setTargetUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddFriend = async () => {
    if (!targetUid || targetUid === uid) return;
    setIsLoading(true);
    setError('');
    try {
      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', targetUid));
      if (!userDoc.exists()) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      // Check if friendship already exists
      const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
      const snapshot = await getDocs(q);
      const exists = snapshot.docs.some(doc => doc.data().users.includes(targetUid));
      
      if (exists) {
        setError('Friendship already exists');
        setIsLoading(false);
        return;
      }

      await addDoc(collection(db, 'friendships'), {
        users: [uid, targetUid],
        status: 'accepted', // Auto-accept for demo purposes
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to add friend');
    }
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-card-bg rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Add Buddy</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Friend's UID</label>
            <input 
              type="text" 
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="Enter UID..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-brand-orange transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
          <button 
            onClick={handleAddFriend}
            disabled={isLoading || !targetUid}
            className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Friend'}
          </button>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your UID</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(uid);
                  alert('UID Copied!');
                }}
                className="text-[8px] text-brand-orange font-bold uppercase tracking-widest hover:underline"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-brand-orange font-mono break-all">{uid}</p>
            <p className="text-[8px] text-gray-600 mt-2">Share this with friends so they can add you!</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DashboardScreen({ 
  activeTab, 
  setActiveTab, 
  onStartRide,
  setSelectedDestination,
  profile,
  onLogout
}: { 
  activeTab: 'ride' | 'community' | 'profile', 
  setActiveTab: (tab: 'ride' | 'community' | 'profile') => void,
  onStartRide: () => void,
  setSelectedDestination: (dest: any) => void,
  profile: RiderProfile | null,
  onLogout: () => void
}) {
  const [showExpenses, setShowExpenses] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'rides'), where('uid', '==', profile.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentRides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride)));
    });
    return () => unsubscribe();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-dark-bg overflow-hidden">
      <AnimatePresence>
        {showExpenses && <ExpenseTrackingModal uid={profile.uid} onClose={() => setShowExpenses(false)} />}
        {showUpload && <RideUploadModal uid={profile.uid} currentPoints={profile.points} onClose={() => setShowUpload(false)} />}
        {showRank && <RankDetailsModal profile={profile} onClose={() => setShowRank(false)} />}
        {showAddFriend && <AddFriendModal uid={profile.uid} onClose={() => setShowAddFriend(false)} />}
      </AnimatePresence>
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-24">
        {activeTab === 'ride' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header Tabs */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {['Maps', 'Ride', 'Community', 'Profile'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => {
                    if (tab === 'Ride') setActiveTab('ride');
                    else if (tab === 'Community') setActiveTab('community');
                    else if (tab === 'Profile') setActiveTab('profile');
                    else if (tab === 'Maps') setActiveTab('ride');
                  }}
                  className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    (tab === 'Ride' && (activeTab as string) === 'ride') || 
                    (tab === 'Community' && (activeTab as string) === 'community') || 
                    (tab === 'Profile' && (activeTab as string) === 'profile') ||
                    (tab === 'Maps' && (activeTab as string) === 'ride')
                      ? 'bg-brand-orange text-white' : 'bg-card-bg text-gray-400'
                  }`}
                >
                  {tab === 'Maps' && <MapPin size={14} className="inline mr-2" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Where to ride?"
                className="w-full bg-card-bg border-none rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-1 focus:ring-brand-orange/50 transition-all"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setShowRank(true)}
                className="bg-brand-orange rounded-3xl p-4 aspect-square flex flex-col justify-between text-left active:scale-95 transition-all"
              >
                <Award size={24} className="text-black/80" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-black/60">Rank</p>
                  <p className="text-sm font-bold text-black">{profile.rank}</p>
                </div>
              </button>
              <button 
                onClick={() => setShowUpload(true)}
                className="bg-brand-orange rounded-3xl p-4 aspect-square flex flex-col justify-between text-left active:scale-95 transition-all"
              >
                <Plus size={24} className="text-black/80" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-black/60">Upload</p>
                  <p className="text-sm font-bold text-black">New</p>
                </div>
              </button>
              <button 
                onClick={() => setShowExpenses(true)}
                className="bg-brand-orange rounded-3xl p-4 aspect-square flex flex-col justify-between text-left active:scale-95 transition-all"
              >
                <Fuel size={24} className="text-black/80" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-black/60">Expense</p>
                  <p className="text-sm font-bold text-black">Track</p>
                </div>
              </button>
            </div>

            {/* Plan a Trip */}
            <button 
              onClick={onStartRide}
              className="w-full bg-brand-orange rounded-3xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center">
                  <Users size={24} className="text-black" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-black">Plan a Trip</h3>
                  <p className="text-sm text-black/60">Ride with friends</p>
                </div>
              </div>
              <Plus size={24} className="text-black" />
            </button>

            {/* Recent Destinations */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Destinations</h4>
              {MOCK_DESTINATIONS.map((dest) => (
                <button 
                  key={dest.id} 
                  onClick={() => {
                    setSelectedDestination(dest);
                    onStartRide();
                  }}
                  className="w-full bg-card-bg rounded-3xl p-5 flex items-center gap-4 text-left hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <MapPin size={24} className="text-brand-orange" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{dest.name}</h5>
                    <p className="text-xs text-gray-500">{dest.distance} • {dest.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'community' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar"
          >
            {/* Live Rides Section */}
            <LiveRidesSection uid={profile.uid} />

            {/* Community Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 border-b-4 border-brand-orange/20 shadow-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Now</p>
                <p className="text-3xl font-black text-gray-800 italic tracking-tighter">1,284</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border-b-4 border-blue-600/20 shadow-xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Group Rides</p>
                <p className="text-3xl font-black text-gray-800 italic tracking-tighter">42</p>
              </div>
            </div>

            {/* Friends Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Riding Buddies</h3>
                <button 
                  onClick={() => setShowAddFriend(true)}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {[
                  { name: "Alex", status: "online", img: "https://picsum.photos/seed/alex/100/100" },
                  { name: "Sarah", status: "online", img: "https://picsum.photos/seed/sarah/100/100" },
                  { name: "Mike", status: "offline", img: "https://picsum.photos/seed/mike/100/100" },
                  { name: "Elena", status: "online", img: "https://picsum.photos/seed/elena/100/100" },
                  { name: "Chris", status: "online", img: "https://picsum.photos/seed/chris/100/100" },
                ].map((buddy, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-brand-orange to-yellow-400">
                        <img src={buddy.img} alt={buddy.name} className="w-full h-full rounded-full object-cover border-2 border-dark-bg" referrerPolicy="no-referrer" />
                      </div>
                      {buddy.status === 'online' && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-bg" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{buddy.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Group Rides Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Upcoming Group Rides</h3>
                <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white"><Plus size={20} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Coastal Cruise", date: "Tomorrow, 06:00 AM", riders: 12, distance: "120 km", img: "https://picsum.photos/seed/coast/400/200" },
                  { title: "Mountain Twisties", date: "Sunday, 07:30 AM", riders: 8, distance: "85 km", img: "https://picsum.photos/seed/mountain/400/200" },
                ].map((ride, i) => (
                  <div key={i} className="bg-card-bg rounded-[32px] overflow-hidden border border-white/5 shadow-2xl group active:scale-[0.98] transition-all">
                    <div className="h-32 relative">
                      <img src={ride.img} alt={ride.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card-bg to-transparent" />
                      <div className="absolute bottom-4 left-6">
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{ride.title}</h4>
                        <p className="text-[10px] text-brand-orange font-bold uppercase tracking-widest">{ride.date}</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{ride.riders}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <MapPin size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{ride.distance}</span>
                        </div>
                      </div>
                      <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-[10px] font-black text-white uppercase transition-all">
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-brand-orange p-1 shadow-lg shadow-brand-orange/20">
                  <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center">
                    <span className="text-2xl font-black text-brand-orange italic">{profile.name[0]}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{profile.name}</h2>
                  <div className="inline-flex items-center gap-1 bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[10px] font-black uppercase mt-1">
                    <TrendingUp size={12} /> {profile.rank}
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-3 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 active:scale-95 transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>

            <div className="bg-card-bg rounded-3xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Bike className="text-brand-orange" size={20} />
                <div>
                  <h4 className="font-bold text-white">{profile.bike}</h4>
                  <p className="text-xs text-gray-500">{profile.mileage} km/l average</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Progress to Pathfinder</span>
                  <span className="text-brand-orange">🎯 {1000 - profile.points} pts to go</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-orange rounded-full" style={{ width: `${(profile.points / 1000) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, label: 'Distance', value: `${profile.totalDistance} km` },
                { icon: Bike, label: 'Rides', value: profile.ridesCount },
                { icon: Award, label: 'Points', value: profile.points },
                { icon: Calendar, label: 'Member', value: new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) },
              ].map((stat, i) => (
                <div key={i} className="bg-card-bg rounded-3xl p-6 space-y-4 border border-gray-800">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                    <stat.icon size={20} className="text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ride History in Profile */}
            <div className="bg-card-bg rounded-[32px] p-6 border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Ride History</h4>
                <div className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[8px] font-black uppercase">
                  {recentRides.length} Total
                </div>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {recentRides.map((ride) => (
                  <div key={ride.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin size={20} className="text-brand-orange" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{ride.destination}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={10} className="text-gray-500" />
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {ride.timestamp?.toDate ? ride.timestamp.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white italic tracking-tighter">{ride.distance} km</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{ride.duration}</p>
                    </div>
                  </div>
                ))}
                {recentRides.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bike size={32} className="text-gray-700" />
                    </div>
                    <p className="text-gray-500 italic text-sm font-medium">No rides tracked yet.</p>
                    <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-1">Start your first journey to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-bg via-dark-bg to-transparent">
        <div className="bg-card-bg/80 backdrop-blur-xl rounded-3xl p-2 flex items-center justify-between border border-white/5">
          {[
            { id: 'ride', icon: MapIcon, label: 'RIDE' },
            { id: 'community', icon: Users, label: 'COMMUNITY' },
            { id: 'profile', icon: User, label: 'PROFILE' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'ride' | 'community' | 'profile')}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all ${
                activeTab === tab.id ? 'bg-brand-orange/10 text-brand-orange' : 'text-gray-500'
              }`}
            >
              <tab.icon size={24} />
              <span className="text-[10px] font-bold mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NearbyRiders({ onClose }: { onClose: () => void }) {
  const riders = [
    { name: "Alex", bike: "MT-09", distance: "0.8 km", status: "Riding" },
    { name: "Sarah", bike: "Z900", distance: "1.2 km", status: "Riding" },
    { name: "Mike", bike: "R1", distance: "2.5 km", status: "Stopped" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm bg-card-bg rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Nearby Riders</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="space-y-4">
          {riders.map((rider, i) => (
            <div key={i} className="bg-white/5 rounded-3xl p-4 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase italic tracking-tighter">{rider.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{rider.bike} • {rider.distance}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${rider.status === 'Riding' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                {rider.status}
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-8 bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 transition-all">
          Broadcast Alert
        </button>
      </div>
    </motion.div>
  );
}

function LiveShareModal({ 
  uid, 
  name,
  onClose 
}: { 
  uid: string, 
  name: string,
  onClose: () => void 
}) {
  const [friends, setFriends] = useState<RiderProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid), where('status', '==', 'accepted'));
      const snapshot = await getDocs(q);
      const friendUids = snapshot.docs.map(doc => doc.data().users.find((id: string) => id !== uid));
      
      if (friendUids.length > 0) {
        const friendProfiles = await Promise.all(friendUids.map(async (id: string) => {
          const docSnap = await getDoc(doc(db, 'users', id));
          return docSnap.data() as RiderProfile;
        }));
        setFriends(friendProfiles);
      } else {
        setFriends([
          { uid: 'mock1', name: 'Alex', bike: 'MT-09', points: 1200, ridesCount: 15, totalDistance: 850, rank: 'Pathfinder', memberSince: '' },
          { uid: 'mock2', name: 'Sarah', bike: 'Z900', points: 950, ridesCount: 10, totalDistance: 620, rank: 'Scout', memberSince: '' },
        ]);
      }
    };
    fetchFriends();

    const checkSharing = async () => {
      const docSnap = await getDoc(doc(db, 'live_rides', uid));
      if (docSnap.exists() && docSnap.data().status === 'Riding') {
        setIsSharing(true);
        setSelectedFriends(docSnap.data().sharingWith || []);
      }
    };
    checkSharing();
  }, [uid]);

  const toggleFriend = (friendUid: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendUid) ? prev.filter(id => id !== friendUid) : [...prev, friendUid]
    );
  };

  const handleStartSharing = async () => {
    if (selectedFriends.length === 0) return;
    
    await setDoc(doc(db, 'live_rides', uid), {
      uid,
      name,
      location: { lat: 19.0760, lng: 72.8777 },
      status: 'Riding',
      destination: 'Lonavala Hills',
      sharingWith: selectedFriends,
      lastUpdated: serverTimestamp()
    });
    setIsSharing(true);
    onClose();
  };

  const handleStopSharing = async () => {
    await setDoc(doc(db, 'live_rides', uid), {
      status: 'Offline',
      lastUpdated: serverTimestamp()
    }, { merge: true });
    setIsSharing(false);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-card-bg rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Live Sharing</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Select friends to share your live location with</p>

        <div className="space-y-3 mb-8 max-h-60 overflow-y-auto no-scrollbar">
          {friends.map((friend) => (
            <button
              key={friend.uid}
              onClick={() => toggleFriend(friend.uid)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                selectedFriends.includes(friend.uid) 
                  ? 'bg-brand-orange/20 border-brand-orange text-white' 
                  : 'bg-white/5 border-white/5 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-brand-orange font-bold">
                  {friend.name[0]}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{friend.name}</p>
                  <p className="text-[10px] opacity-60">{friend.bike}</p>
                </div>
              </div>
              {selectedFriends.includes(friend.uid) && <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleStartSharing}
            disabled={selectedFriends.length === 0}
            className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSharing ? 'Update Sharing' : 'Start Live Sharing'}
          </button>
          {isSharing && (
            <button 
              onClick={handleStopSharing}
              className="w-full bg-red-500/10 border border-red-500/20 py-4 rounded-2xl text-red-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Stop Sharing
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NavigationScreen({ onExit, profile, destination }: { onExit: () => void, profile: RiderProfile, destination: any }) {
  const [showAI, setShowAI] = useState(false);
  const [showRiders, setShowRiders] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showLiveShare, setShowLiveShare] = useState(false);
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(['most scenic']);
  const [aiAdvice, setAiAdvice] = useState<NavigationAdvice | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [speedLimit, setSpeedLimit] = useState(80);
  const [currentSpeed, setCurrentSpeed] = useState(84);
  const [fuelLevel, setFuelLevel] = useState(45);
  const [nextTurn, setNextTurn] = useState("Turn left onto NH 48");
  const [showCamera, setShowCamera] = useState(false);
  const [detectionSource, setDetectionSource] = useState<'camera' | 'location'>('location');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Google Maps States
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<string>("0 km");
  const [routeDuration, setRouteDuration] = useState<string>("0 min");

  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || "",
    libraries: LIBRARIES
  });

  if (!apiKey) {
    return (
      <div className="flex-1 bg-dark-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
          <MapPin size={40} className="text-brand-orange" />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">Maps Setup Required</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">
          To enable real-time navigation, please add your <span className="text-brand-orange font-bold">Google Maps API Key</span> to the environment variables in the AI Studio Secrets panel.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <a 
            href="https://console.cloud.google.com/google/maps-apis/credentials" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Get API Key
          </a>
          <button 
            onClick={onExit} 
            className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all orange-glow"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 bg-dark-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">Invalid API Key</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs">
          The Google Maps API key provided is invalid. Please ensure it has the <span className="text-red-500 font-bold">Maps JavaScript API</span> and <span className="text-red-500 font-bold">Directions API</span> enabled.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()} 
            className="block w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Retry Connection
          </button>
          <button 
            onClick={onExit} 
            className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all orange-glow"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const center = {
    lat: 18.5204, // Pune, India (Default center)
    lng: 73.8567
  };

  useEffect(() => {
    if (isLoaded && destination && map) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: center,
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
            if (result && result.routes[0].legs[0]) {
              const leg = result.routes[0].legs[0];
              setRouteDistance(leg.distance?.text || "0 km");
              setRouteDuration(leg.duration?.text || "0 min");
              if (leg.steps[0]) {
                setNextTurn(leg.steps[0].instructions.replace(/<[^>]*>?/gm, ''));
              }
            }
          }
        }
      );

      // Search for landmarks (hotels, puncture shops)
      const service = new google.maps.places.PlacesService(map);
      const request = {
        location: center,
        radius: 5000,
        type: 'lodging', // Hotels
        keyword: 'puncture shop'
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setLandmarks(results);
        }
      });
    }
  }, [isLoaded, destination, map]);

  // Haptic Feedback Helper
  const triggerHaptic = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Vibration not supported or blocked", e);
      }
    }
  };

  // Speeding Alert Vibration
  useEffect(() => {
    if (currentSpeed > speedLimit) {
      triggerHaptic([200, 100, 200]);
    }
  }, [currentSpeed > speedLimit]);

  // Low Fuel Vibration
  useEffect(() => {
    if (fuelLevel < 15 && fuelLevel > 14.9) { // Trigger once when crossing 15%
      triggerHaptic([500, 200, 500]);
    }
  }, [fuelLevel < 15]);

  // Turn-by-turn Vibration
  useEffect(() => {
    triggerHaptic(100); // Short pulse for new direction
  }, [nextTurn]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'live_rides', profile.uid), (doc) => {
      if (doc.exists() && doc.data().status === 'Riding') {
        setIsLiveSharing(true);
      } else {
        setIsLiveSharing(false);
      }
    });
    return () => unsubscribe();
  }, [profile.uid]);

  const availablePreferences = [
    { id: 'most scenic', label: 'Most Scenic' },
    { id: 'fastest', label: 'Fastest' },
    { id: 'least traffic', label: 'Least Traffic' },
    { id: 'historical routes', label: 'Historical Routes' },
    { id: 'avoid tolls', label: 'Avoid Tolls' },
    { id: 'avoid highways', label: 'Avoid Highways' },
  ];

  const togglePreference = (prefId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(prefId) 
        ? prev.filter(p => p !== prefId) 
        : [...prev, prefId]
    );
  };

  // Simulate speed limit detection and speed changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly change speed slightly
      setCurrentSpeed(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(0, prev + delta);
      });

      // Simulate fuel consumption
      setFuelLevel(prev => Math.max(0, prev - 0.1));

      // Occasionally change speed limit (simulated detection)
      if (Math.random() > 0.92) {
        const limits = [40, 60, 80, 100, 120];
        const newLimit = limits[Math.floor(Math.random() * limits.length)];
        
        if (showCamera && Math.random() > 0.4) {
          // Simulate Camera Detection
          setIsScanning(true);
          setTimeout(() => {
            setSpeedLimit(newLimit);
            setDetectionSource('camera');
            setIsScanning(false);
            triggerHaptic(50); // Subtle haptic for new sign detected
          }, 1500);
        } else {
          // Simulate Location-based update
          setSpeedLimit(newLimit);
          setDetectionSource('location');
        }
      }

      // Occasionally change turn
      if (Math.random() > 0.98) {
        const turns = [
          "Turn right onto Expressway",
          "Slight left towards Service Road",
          "Take the exit towards Lonavala",
          "Continue straight for 5km"
        ];
        setNextTurn(turns[Math.floor(Math.random() * turns.length)]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAIAdvice = async () => {
    setIsLoadingAI(true);
    const advice = await getAIPillionAdvice(
      "Mumbai, India", 
      "Lonavala Hills", 
      selectedPreferences.length > 0 ? selectedPreferences : ["standard"]
    );
    setAiAdvice(advice);
    setIsLoadingAI(false);
    setShowAI(true);
    setShowPreferences(false);
  };

  const toggleCamera = async () => {
    if (showCamera) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setShowCamera(true);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 100);
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
  };

  const isSpeeding = currentSpeed > speedLimit;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="flex-1 bg-dark-bg flex flex-col relative bg-grid overflow-hidden"
    >
      {/* Nearby Riders Overlay */}
      <AnimatePresence>
        {showRiders && <NearbyRiders onClose={() => setShowRiders(false)} />}
        {showLiveShare && <LiveShareModal uid={profile.uid} name={profile.name} onClose={() => setShowLiveShare(false)} />}
      </AnimatePresence>

      {/* Route Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm bg-card-bg rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Route Preferences</h3>
                <button onClick={() => setShowPreferences(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {availablePreferences.map((pref) => (
                  <button
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedPreferences.includes(pref.id)
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchAIAdvice}
                disabled={isLoadingAI}
                className="w-full bg-brand-orange py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoadingAI ? 'Consulting AI...' : 'Get AI Suggestions'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera View for Sign Detection */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-black"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-brand-orange/30 rounded-3xl relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-brand-orange/50 rounded-full animate-pulse" />
                <div className="absolute top-10 left-10 text-brand-orange text-[10px] font-bold uppercase tracking-widest">
                  AI Vision Active • Scanning for signs
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Background Simulation */}
      {!showCamera && (
        <div className="absolute inset-0 z-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={14}
              onLoad={map => setMap(map)}
              options={{
                styles: DARK_MAP_STYLES,
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
              }}
            >
              {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
              
              {/* Origin Marker */}
              <Marker position={center} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
              
              {/* Destination Marker */}
              {destination && (
                <Marker position={{ lat: destination.lat, lng: destination.lng }} />
              )}

              {/* Landmarks */}
              {landmarks.map((landmark, idx) => (
                <Marker 
                  key={idx} 
                  position={landmark.geometry.location} 
                  onClick={() => setSelectedLandmark(landmark)}
                  icon={{
                    url: landmark.types.includes('lodging') 
                      ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' 
                      : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                    scaledSize: new google.maps.Size(30, 30)
                  }}
                />
              ))}

              {selectedLandmark && (
                <InfoWindow 
                  position={selectedLandmark.geometry.location}
                  onCloseClick={() => setSelectedLandmark(null)}
                >
                  <div className="p-2 text-black">
                    <h6 className="font-bold text-xs">{selectedLandmark.name}</h6>
                    <p className="text-[10px]">{selectedLandmark.vicinity}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-dark-bg flex items-center justify-center">
              <div className="text-brand-orange animate-pulse font-black uppercase tracking-widest">Loading Maps...</div>
            </div>
          )}
        </div>
      )}

      {/* Top Navigation Card - Carbon Fiber Style */}
      <div className="pt-0 px-0 pb-4 z-10">
        <div className="bg-carbon rounded-b-3xl p-3 flex items-center gap-4 shadow-2xl border-b-4 border-brand-orange/30">
          <button 
            onClick={onExit}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/10"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-orange italic tracking-tighter">{routeDistance}</span>
            </div>
            <p className="text-base font-bold text-white uppercase italic tracking-tight leading-tight">
              {nextTurn}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 pr-4">
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80">
              <X size={16} />
            </button>
            <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Exit</span>
          </div>
        </div>

        {/* Speeding Alert */}
        <AnimatePresence>
          {isSpeeding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 bg-red-600 rounded-3xl p-4 flex items-center gap-4 shadow-lg shadow-red-600/20"
            >
              <AlertTriangle className="text-white animate-bounce" size={24} />
              <p className="text-sm font-black text-white uppercase italic tracking-tighter">Slow down! You are exceeding the speed limit.</p>
            </motion.div>
          )}
          {fuelLevel < 20 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 bg-yellow-500 rounded-3xl p-4 flex items-center gap-4 shadow-lg shadow-yellow-500/20"
            >
              <Fuel className="text-white animate-pulse" size={24} />
              <p className="text-sm font-black text-white uppercase italic tracking-tighter">Low Fuel! {fuelLevel.toFixed(1)}% remaining. Find a station.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Speedometer & Speed Limit Overlay */}
      <div className="absolute left-6 bottom-44 z-10">
        <div className={`bg-carbon rounded-[40px] p-2 pr-6 border ${isSpeeding ? 'border-red-600 animate-pulse' : 'border-white/10'} shadow-2xl flex items-center gap-4`}>
          {/* Speed Limit Sign */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white border-4 border-red-600 flex items-center justify-center shadow-lg relative z-10">
              <span className="text-2xl font-black text-brand-orange italic">{speedLimit}</span>
            </div>
            {isScanning && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 rounded-full border-4 border-brand-orange animate-ping z-0"
              />
            )}
            <div className="absolute -top-1 -right-1 z-20">
              <div className={`p-1 rounded-full ${detectionSource === 'camera' ? 'bg-brand-orange' : 'bg-blue-600'} text-white shadow-lg`}>
                {detectionSource === 'camera' ? <Flashlight size={10} /> : <MapPin size={10} />}
              </div>
            </div>
          </div>

          {/* Current Speed */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black italic tracking-tighter ${isSpeeding ? 'text-red-500' : 'text-brand-orange'}`}>{currentSpeed}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">km/h</span>
            </div>
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">
              {isScanning ? 'Scanning...' : `${detectionSource} sync`}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls & AI Advice */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 space-y-6">
        {/* Dynamic AI Advice Banner */}
        <AnimatePresence>
          {aiAdvice && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-orange rounded-3xl p-5 flex flex-col gap-3 orange-glow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Lightbulb className="text-white" size={24} />
                  <div>
                    <h4 className="font-bold text-white uppercase italic tracking-tighter">{aiAdvice.routeSuggestion}</h4>
                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{routeDuration} remaining • {aiAdvice.weatherUpdate}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase">
                    EFF: {aiAdvice.optimizedRouteDetails.efficiencyScore}%
                  </div>
                  <div className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase">
                    SAFE: {aiAdvice.optimizedRouteDetails.safetyScore}%
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-white/20 w-full" />
              
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest">
                  Traffic: <span className="text-white">{aiAdvice.optimizedRouteDetails.trafficCondition}</span>
                </p>
                {aiAdvice.optimizedRouteDetails.roadClosures.length > 0 && (
                  <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">
                    Closures: {aiAdvice.optimizedRouteDetails.roadClosures.join(", ")}
                  </p>
                )}
                <p className="text-[9px] text-white/70 italic">
                  Alt: {aiAdvice.optimizedRouteDetails.alternativeRoute}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons Row */}
        <div className="flex justify-between items-center bg-black/40 backdrop-blur-xl rounded-[32px] p-2 border border-white/10 shadow-2xl">
          {[
            { 
              icon: Share2, 
              color: isLiveSharing ? 'bg-green-500' : 'bg-white/10',
              onClick: () => setShowLiveShare(true)
            },
            { icon: AlertTriangle, color: 'bg-red-600/20 text-red-500' },
            { icon: MessageSquare, color: 'bg-blue-600/20 text-blue-500', onClick: () => setShowRiders(!showRiders) },
            { 
              icon: Flashlight, 
              color: showCamera ? 'bg-brand-orange' : 'bg-white/10', 
              onClick: toggleCamera 
            },
            { 
              icon: Bot, 
              color: isLoadingAI ? 'bg-white/5 animate-pulse' : 'bg-brand-orange', 
              onClick: () => setShowPreferences(true) 
            },
            { 
              icon: LogOut, 
              color: 'bg-red-600', 
              onClick: onExit 
            }
          ].map((btn, i) => (
            <button 
              key={i}
              onClick={btn.onClick}
              className={`w-12 h-12 rounded-2xl ${btn.color} flex items-center justify-center transition-all active:scale-90 border border-white/5`}
            >
              <btn.icon size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Nearby Riders Overlay */}
      <AnimatePresence>
        {showRiders && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="absolute right-24 top-1/2 -translate-y-1/2 bg-card-bg/95 backdrop-blur-xl rounded-3xl p-4 w-48 shadow-2xl border border-white/5 z-20"
          >
            <div className="space-y-4">
              {MOCK_RIDERS.map((rider) => (
                <div key={rider.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{rider.name}</p>
                      <p className="text-[8px] text-gray-500">{rider.distance}</p>
                    </div>
                  </div>
                  <Volume2 size={14} className="text-brand-orange" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Pillion Dialog */}
      <AnimatePresence>
        {showAI && aiAdvice && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card-bg rounded-[32px] p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Bot className="text-brand-orange" size={28} />
                  <h3 className="text-2xl font-bold">AI Pillion</h3>
                </div>
                <button onClick={() => setShowAI(false)} className="text-gray-500">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-brand-orange/10 rounded-2xl border border-brand-orange/20">
                  <h4 className="text-brand-orange text-xs font-bold uppercase mb-1">Route Suggestion</h4>
                  <p className="text-sm text-gray-200">{aiAdvice.routeSuggestion}</p>
                </div>

                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <h4 className="text-red-500 text-xs font-bold uppercase mb-1">Safety Alerts</h4>
                  <ul className="text-sm text-gray-200 list-disc list-inside">
                    {aiAdvice.safetyAlerts.map((alert, i) => (
                      <li key={i}>{alert}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <h4 className="text-blue-500 text-xs font-bold uppercase mb-1">Weather</h4>
                    <p className="text-xs text-gray-200">{aiAdvice.weatherUpdate}</p>
                  </div>
                  <div className="flex-1 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <h4 className="text-green-500 text-xs font-bold uppercase mb-1">Impact</h4>
                    <p className="text-xs text-gray-200">{aiAdvice.estimatedTimeImpact}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAI(false)}
                  className="flex-1 py-4 rounded-2xl bg-brand-orange text-white font-bold text-lg active:scale-95 transition-all"
                >
                  Apply Route
                </button>
                <button 
                  onClick={() => setShowAI(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-800 text-white font-bold text-lg active:scale-95 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
