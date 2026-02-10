import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, CheckCircle, AlertCircle, ShieldCheck, Eye, User, FlaskConical } from 'lucide-react';
import { RoutePath } from '../types';
import { useStore } from '../context/StoreContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';

import CodeVerificationModal from './CodeVerificationModal';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const { currentUser, logout, access } = useStore();
  const navigate = useNavigate();

  // Verification State
  const [code, setCode] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync access state from session (Stability Fix)
  useEffect(() => {
    if (sessionStorage.getItem('id_access_unlocked') === 'true') access.unlockId();
    if (sessionStorage.getItem('transparency_access_unlocked') === 'true') access.unlockTransparency();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const verifyCode = async () => {
    if (!code || !currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        let success = false;

        // Check ID Access
        if (data.accessCode === code) {
          access.unlockId();
          sessionStorage.setItem('id_access_unlocked', 'true');
          showToast("ID Access Unlocked! ✅", "success");
          success = true;
        }

        // Check Transparency Access
        if (data.transparencyCode === code) {
          access.unlockTransparency();
          sessionStorage.setItem('transparency_access_unlocked', 'true');
          showToast("Transparency Unlocked! ✅", "success");
          success = true;
        }

        if (!success) {
          showToast("Invalid Code ❌", "error");
        } else {
          setCode(''); // Clear code on success
        }

      } else {
        showToast("User Error", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error Verifying Code", "error");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(RoutePath.HOME);
  };

  const navLinks = [
    { label: 'Home', path: RoutePath.HOME },
    { label: 'About', path: '/about' },
    { label: 'Gallery', path: RoutePath.GALLERY },
    { label: 'News', path: RoutePath.NEWS },
    { label: 'Contact', path: '/contact' },
    { label: 'Help', path: '/help' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div className="max-w-7xl mx-auto bg-black/80 backdrop-blur-md border border-red-600/50 rounded-full px-6 py-3 shadow-[0_0_20px_rgba(255,0,0,0.6)] flex justify-between items-center relative">

          {/* LEFT: Logo Area */}
          <div onClick={() => navigate('/')} className="flex items-center gap-2 group cursor-pointer">
            <img
              src="https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png"
              alt="NCSS Crest"
              className="h-14 w-auto object-contain mr-3 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]"
            />
            <span className="font-bold text-lg tracking-tight text-white">
              NCSS <span className="text-red-600">MEMBERS</span>
            </span>
          </div>

          {/* CENTER: Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-all duration-300 ${isActive
                    ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'text-gray-300 hover:text-red-400'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* RIGHT: User & Actions */}
          <div className="hidden md:flex items-center gap-4">

            {/* Unified Access (Secret Code) */}
            {currentUser && (
              <div className="flex items-center gap-2 mr-2">
                {/* Unlocked Badges */}
                {access.transparencyUnlocked && (
                  <button onClick={() => navigate(RoutePath.TRANSPARENCY)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Transparency">
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                )}
                {access.idUnlocked && (
                  <button onClick={() => navigate(RoutePath.GENERATE_ID)} className="p-1.5 bg-red-600/20 border border-red-600/50 rounded-full hover:bg-red-600/40 transition-colors" title="Get ID">
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                  </button>
                )}

                <div className="flex items-center bg-black/50 rounded-full border border-white/10 px-2 py-1">
                  <input
                    type="text"
                    className="bg-transparent border-none outline-none w-20 text-xs text-white placeholder-gray-600 text-center"
                    placeholder="Code..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                  />
                </div>
              </div>
            )}

            {currentUser ? (
              <div className="relative group/profile">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <span className="text-xs font-bold text-white max-w-[80px] truncate">{currentUser.name}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-black p-[1px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-red-500">{currentUser.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-4 w-56 bg-black/90 backdrop-blur-xl border border-red-900/30 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 transform origin-top-right overflow-hidden z-50">
                  <div className="p-2 flex flex-col gap-1">
                    <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-gray-200 hover:text-white transition-colors flex items-center gap-3">
                      <User className="w-4 h-4" /> My Profile
                    </button>

                    {['SUPER_ADMIN', 'MEMBER_ADMIN', 'super_admin', 'admin'].includes(currentUser.role || '') && (
                      <button onClick={() => navigate(RoutePath.DASHBOARD)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-gray-200 hover:text-white transition-colors flex items-center gap-3">
                        <LayoutDashboard className="w-4 h-4" /> Admin Panel {['SUPER_ADMIN', 'super_admin'].includes(currentUser.role || '') && "(Super)"}
                      </button>
                    )}
                    {/* MEMBER DASHBOARD BUTTON */}
                    {['USER', 'member'].includes(currentUser.role || '') && (
                      <button
                        onClick={async () => {
                          if (!currentUser) return;
                          try {
                            // 1. Force fetch latest data
                            const userDoc = await getDoc(doc(db, "users", currentUser.id));

                            if (userDoc.exists()) {
                              const userData = userDoc.data();
                              const role = userData.role || 'USER';

                              // 2. Check Approval (Exempt Super Admin)
                              const isSuper = ['super_admin', 'SUPER_ADMIN'].includes(role);
                              if (!userData.isApproved && !isSuper) {
                                alert("Your account is pending approval.");
                                return;
                              }

                              // 3. ROUTING SWITCH
                              if (['member', 'USER'].includes(role)) {
                                navigate('/member/dashboard'); // SEND MEMBERS HERE
                              } else if (['admin', 'super_admin', 'SUPER_ADMIN', 'MEMBER_ADMIN'].includes(role)) {
                                navigate('/dashboard'); // SEND ADMINS HERE (to Admin Dashboard)
                              } else {
                                navigate('/'); // Fallback
                              }
                            }
                          } catch (error) {
                            console.error("Navigation error:", error);
                            alert("System error. Please try again.");
                          }
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-gray-200 hover:text-white transition-colors flex items-center gap-3"
                      >
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </button>
                    )}
                    <div className="h-px bg-white/10 my-1 mx-2"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-900/20 text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => navigate(RoutePath.LOGIN)} className="px-5 py-2 text-xs font-bold text-white hover:text-red-400 transition-colors">
                  Sign In
                </button>
                <button onClick={() => navigate(RoutePath.LOGIN)} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all">
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-red-500 p-2">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown (Floating) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 right-0 mt-4 mx-4 bg-black/95 backdrop-blur-xl border border-red-900/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-lg font-bold text-center py-2 ${isActive ? 'text-red-500' : 'text-gray-400'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="h-px w-full bg-white/10" />
              <div className="flex flex-col gap-3">
                {currentUser ? (
                  <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-900/20 text-red-500 font-bold border border-red-900/50">Log Out</button>
                ) : (
                  <button onClick={() => { navigate(RoutePath.LOGIN); setIsMobileMenuOpen(false) }} className="w-full py-3 rounded-xl bg-red-600 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)]">Sign In</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav >

      {/* Toast Notification Container (Fixed) */}
      <AnimatePresence>
        {
          toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`fixed top-24 right-8 px-6 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 z-[60] ${toast.type === 'success'
                ? 'bg-green-900/90 border-green-500 text-white shadow-green-500/20'
                : 'bg-red-900/90 border-red-500 text-white shadow-red-500/20'
                }`}
            >
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
              <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
            </motion.div>
          )
        }
      </AnimatePresence >
      <CodeVerificationModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />
    </>
  );
};

export default Navbar;