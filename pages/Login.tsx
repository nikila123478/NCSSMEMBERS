import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../types';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setTimeout(() => navigate(RoutePath.DASHBOARD), 500);
    } catch (err: any) {
      console.error("Login failed", err);
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black p-4 font-outfit">

      {/* --- 3D FLOATING CARD CONTAINER --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row w-full max-w-4xl bg-black/60 backdrop-blur-2xl border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden"
      >

        {/* LEFT SIDE: VIDEO BOX (Contained) */}
        <div className="w-full md:w-1/2 relative h-48 md:h-auto border-b md:border-b-0 md:border-r border-red-500/20 group">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          >
            <source src="/animation.mp4" type="video/mp4" />
          </video>
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30"></div>

          {/* Text inside the video box */}
          <div className="absolute bottom-6 left-6 z-10">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">NCSS</h2>
            <p className="text-red-400 text-xs uppercase tracking-widest font-bold">Science | Future</p>
          </div>
        </div>

        {/* RIGHT SIDE: FORM SECTION */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white/5 relative">

          {/* LOGO */}
          <div className="flex justify-center mb-6">
            <img
              src="https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png"
              alt="NCSS Logo"
              className="h-16 w-auto drop-shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse-slow"
            />
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-wide">
            Welcome Back
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-red-200 text-sm font-bold mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl px-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                placeholder="Email Address"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl px-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                placeholder="Password"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Not a member?{' '}
              <button onClick={() => navigate(RoutePath.SIGNUP)} className="text-red-400 font-bold hover:text-red-300 transition-colors">
                Join the Society
              </button>
            </p>
          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default Login;