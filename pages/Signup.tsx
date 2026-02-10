import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { RoutePath } from '../types';
import { Loader2, ArrowRight, AlertCircle, User, Mail, Lock, GraduationCap, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [grade, setGrade] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phoneNumber: phoneNumber,
                grade: grade,
                role: "member",
                createdAt: serverTimestamp()
            });

            navigate(RoutePath.DASHBOARD);

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already exists. Try logging in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-black/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black p-4 pt-24 font-outfit">
            {/* ... previous code ... */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row w-full max-w-4xl bg-black/60 backdrop-blur-2xl border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden"
            >
                {/* ... video section ... */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30"></div>
                    <div className="absolute bottom-6 left-6 z-10">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">NCSS</h2>
                        <p className="text-red-400 text-xs uppercase tracking-widest font-bold">Science | Future</p>
                    </div>
                </div>

                {/* RIGHT SIDE: FORM SECTION */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white/5 relative">
                    <div className="flex justify-center mb-6">
                        <img
                            src="https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png"
                            alt="NCSS Logo"
                            className="h-16 w-auto drop-shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse-slow"
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-wide">
                        Join the Society
                    </h2>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-red-200 text-sm font-bold mb-6">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                                placeholder="Full Name"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                                placeholder="Email Address"
                                required
                            />
                        </div>

                        {/* Phone Number Field */}
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                                placeholder="Phone Number"
                                required
                            />
                        </div>

                        <div className="relative">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3 appearance-none outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all cursor-pointer"
                                required
                            >
                                <option value="" disabled className="bg-gray-900 text-gray-500">Select Grade / Designation</option>
                                <option value="Grade 6" className="bg-gray-900">Grade 6</option>
                                <option value="Grade 7" className="bg-gray-900">Grade 7</option>
                                <option value="Grade 8" className="bg-gray-900">Grade 8</option>
                                <option value="Grade 9" className="bg-gray-900">Grade 9</option>
                                <option value="Grade 10" className="bg-gray-900">Grade 10</option>
                                <option value="Grade 11" className="bg-gray-900">Grade 11</option>
                                <option value="Grade 12" className="bg-gray-900">Grade 12</option>
                                <option value="Grade 13" className="bg-gray-900">Grade 13</option>
                                <option value="Other / Non-School Member" className="bg-gray-900">Other / Non-School Member (Wenath Pudgalayin)</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white rounded-xl pl-12 pr-4 py-3 placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                                placeholder="Password (6+ chars)"
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 transform hover:scale-[1.02] transition-all flex justify-center items-center gap-2 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Already have an account? <Link to={RoutePath.LOGIN} className="text-red-400 font-bold hover:text-red-300 transition-colors">Log In</Link>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
