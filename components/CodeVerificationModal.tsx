import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../types';

interface CodeVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CodeVerificationModal: React.FC<CodeVerificationModalProps> = ({ isOpen, onClose }) => {
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const { currentUser, logout, access } = useStore();
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        // 'code' is the state from the input field
        if (!code || !currentUser) return;

        setVerifying(true);
        setError('');

        try {
            // 1. Fetch the LATEST data directly from Firestore (Bypass local state)
            const userRef = doc(db, "users", currentUser.id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                // 2. Get the code from DB and force it to String + Trim
                // Note: Use the exact field name you saved: 'memberAccessCode'
                const dbCode = String(userData.memberAccessCode || "").trim();

                // 3. Get the input and force it to String + Trim
                const inputCode = String(code).trim();

                // 4. COMPARE
                if (dbCode === inputCode && dbCode !== "") {
                    // SUCCESS
                    // toast.success("Access Granted!"); // (We don't have toast prop here, using basic alert or just proceed)
                    sessionStorage.setItem('member_dashboard_unlocked', 'true');
                    access.unlockMemberDashboard();
                    onClose();
                    navigate(RoutePath.DASHBOARD);
                } else {
                    // FAILURE - SHOW DEBUG ALERT
                    // (Remove this alert after fixing, but needed now to see the issue)
                    alert(`ACCESS DENIED. (DEBUG MODE)\n\nDatabase Has: '${dbCode}'\nYou Typed: '${inputCode}'`);
                    setError("Invalid Code");
                }
            } else {
                setError("User record not found.");
            }
        } catch (err: any) {
            console.error("Verification Error:", err);
            setError("System Error: " + err.message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0a0a0a] border border-red-900/50 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] relative overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                <Lock className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-wider">Security Check</h3>
                            <p className="text-xs text-gray-400 mt-1">Authorized Personnel Only</p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <input
                                    type="text" // Use text to allow alphanumeric
                                    autoFocus
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder-gray-800"
                                    placeholder="••••"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                />
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-xs text-center font-bold"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={verifying}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Dashboard"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CodeVerificationModal;
