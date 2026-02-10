import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import {
    doc, onSnapshot, collection, query, where, orderBy,
    addDoc, deleteDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Message, EventItem, PointHistoryItem, FirestoreUser, RoutePath } from '../types';
import {
    LayoutDashboard, User, Shield, MessageSquare,
    LogOut, TrendingUp, Send, Trash2, Lock, Unlock,
    ChevronRight, Award, Calendar, AlertCircle, Save, Briefcase, Phone, Hash
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'dashboard' | 'profile' | 'id' | 'messages';

const MemberDashboard: React.FC = () => {
    const { currentUser, logout } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // --- Data State ---
    const [userData, setUserData] = useState<FirestoreUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>([]);

    // --- Profile Editing State (Standalone) ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        phoneNumber: '',
        position: '',
        indexNumber: '',
        grade: '',
        bio: '',
        school: ''
    });

    // --- ID Unlock State ---
    const [accessCodeInput, setAccessCodeInput] = useState('');
    const [unlockError, setUnlockError] = useState('');

    // --- Messaging State ---
    const [msgTitle, setMsgTitle] = useState('');
    const [msgDesc, setMsgDesc] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    // --- Listeners & Initialization ---
    useEffect(() => {
        if (!currentUser?.id) return;

        // 1. User Data
        const unsubUser = onSnapshot(doc(db, "users", currentUser.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreUser;
                setUserData(data);
                setPointsHistory(data.pointsHistory || []);

                // Sync Profile Form Data (only if not currently editing to avoid overwriting user input)
                if (!isEditingProfile) {
                    setProfileForm({
                        displayName: data.displayName || data.name || '',
                        phoneNumber: data.phoneNumber || '',
                        position: data.position || 'Member',
                        indexNumber: data.indexNumber || '',
                        grade: data.grade || '',
                        bio: '', // Add mapping if field exists in Firestore
                        school: '' // Add mapping if field exists
                    });
                }
            }
        });

        // 2. Messages
        const qMessages = query(
            collection(db, "messages"),
            where("userId", "==", currentUser.id),
            orderBy("timestamp", "desc")
        );
        const unsubMessages = onSnapshot(qMessages, (snap) => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
        });

        // 3. Events
        const qEvents = query(collection(db, "events"), orderBy("date", "asc"));
        const unsubEvents = onSnapshot(qEvents, (snap) => {
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
        });

        setLoading(false);

        return () => {
            unsubUser();
            unsubMessages();
            unsubEvents();
        };
    }, [currentUser, isEditingProfile]);

    // --- HANDLERS ---

    const switchTab = (tab: Tab, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setActiveTab(tab);
    };

    // 1. Profile Save Handler
    const handleSaveProfile = async (e: React.MouseEvent) => {
        e.preventDefault(); // CRITICAL: Stop reload
        if (!currentUser?.id) return;

        try {
            await updateDoc(doc(db, "users", currentUser.id), {
                displayName: profileForm.displayName,
                name: profileForm.displayName, // Update both for consistency
                phoneNumber: profileForm.phoneNumber,
                position: profileForm.position,
                indexNumber: profileForm.indexNumber,
                grade: profileForm.grade
            });
            alert("✅ Profile Updated Successfully!");
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("❌ Failed to update profile. Please try again.");
        }
    };

    // 2. ID Unlock Handler
    const handleUnlockId = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setUnlockError('');

        // HARDCODED UNIVERSAL ID UNLOCK CODE
        const UNIVERSAL_CODE = "2008032619820228";

        if (accessCodeInput === UNIVERSAL_CODE) {
            try {
                await updateDoc(doc(db, "users", currentUser!.id), { isIdUnlocked: true });
                alert("Identity Verified. Vault Unlocked.");
                setAccessCodeInput('');
            } catch (err) {
                console.error("Error unlocking:", err);
                setUnlockError("System Error. Try again.");
            }
        } else {
            setUnlockError("Invalid Access Code. Access Denied.");
        }
    };

    // 3. Send Message Handler
    const handleSendMessage = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!msgTitle || !msgDesc || !currentUser?.id) {
            alert("Please fill in all fields.");
            return;
        }
        setSendingMsg(true);
        try {
            await addDoc(collection(db, "messages"), {
                userId: currentUser.id,
                userName: userData?.displayName || currentUser.name || 'Member',
                userEmail: userData?.email || currentUser.email || 'No Email',
                userPhoto: userData?.photoURL || currentUser.photoURL || '',
                title: msgTitle,
                description: msgDesc,
                timestamp: serverTimestamp(),
                status: 'unread'
            });
            setMsgTitle('');
            setMsgDesc('');
            alert("Message Sent to Administration!");
        } catch (err: any) {
            console.error("Error sending message:", err);
            alert(`Failed to send message: ${err.message}`);
        } finally {
            setSendingMsg(false);
        }
    };

    const handleDeleteMessage = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm("Delete this message?")) {
            await deleteDoc(doc(db, "messages", id));
        }
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.confirm("Are you sure you want to logout?")) {
            await logout();
            navigate('/login');
        }
    };


    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-red-500 font-mono animate-pulse">LOADING SYSTEM...</div>
        </div>
    );

    const firstName = userData?.displayName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || 'Member';

    return (
        // LAYOUT FIX: pt-24 min-h-screen
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans pt-24">

            {/* --- SIDEBAR --- */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-neutral-900/50 backdrop-blur-xl h-[calc(100vh-6rem)] sticky top-24">
                <div className="p-8">
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        NCSS <span className="text-red-600">MEMBER</span>
                    </h1>
                    <p className="text-xs text-gray-500 font-mono mt-1">SECURE DASHBOARD v2.0</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'profile', label: 'My Profile', icon: User },
                        { id: 'id', label: 'ID Card Vault', icon: Shield },
                        { id: 'messages', label: 'Messages', icon: MessageSquare },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={(e) => switchTab(item.id as Tab, e)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === item.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5" /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black mb-1">
                            {activeTab === 'dashboard' && `Welcome, ${firstName}`}
                            {activeTab === 'profile' && 'My Profile'}
                            {activeTab === 'id' && 'Digital ID Vault'}
                            {activeTab === 'messages' && 'Secure Messaging'}
                        </h2>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 self-start md:self-auto">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-white">{userData?.points || 0} PTS</span>
                    </div>
                </header>

                <AnimatePresence mode="wait">

                    {/* --- TAB: DASHBOARD --- */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 relative overflow-hidden text-white">
                                    <h3 className="text-lg font-bold opacity-80 mb-1">Current Grade</h3>
                                    <div className="text-3xl font-black">{userData?.grade || 'N/A'}</div>
                                    <User className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-white/20" />
                                </div>
                                <div className="bg-[#111] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                    <h3 className="text-lg font-bold text-gray-400 mb-1">Total Points</h3>
                                    <div className="text-3xl font-black text-white">{userData?.points || 0}</div>
                                </div>
                                <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
                                    <h3 className="text-lg font-bold text-gray-400 mb-1">Member Status</h3>
                                    <div className="text-3xl font-black text-green-500">{userData?.isApproved ? 'ACTIVE' : 'PENDING'}</div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-red-500" /> Contribution History
                                </h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={pointsHistory.length > 0 ? pointsHistory : [{ date: 'Start', score: 0 }]}>
                                            <defs>
                                                <linearGradient id="colorScoreRed" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(val) => val.split(',')[0]} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                            <Area type="monotone" dataKey="score" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorScoreRed)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: PROFILE (STANDALONE) --- */}
                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-4xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Personal Information</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
                                    >
                                        {isEditingProfile ? 'Cancel' : 'Edit Details'}
                                    </button>
                                </div>

                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                                <input
                                                    disabled={!isEditingProfile}
                                                    value={profileForm.displayName}
                                                    onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })}
                                                    className={`w-full bg-black border rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-colors ${!isEditingProfile ? 'border-white/5 text-gray-400' : 'border-white/20'}`}
                                                />
                                            </div>
                                        </div>
                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                                <input
                                                    disabled={!isEditingProfile}
                                                    value={profileForm.phoneNumber}
                                                    onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                                    className={`w-full bg-black border rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-colors ${!isEditingProfile ? 'border-white/5 text-gray-400' : 'border-white/20'}`}
                                                />
                                            </div>
                                        </div>
                                        {/* Position */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">Position</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                                <input
                                                    disabled={!isEditingProfile}
                                                    value={profileForm.position}
                                                    onChange={e => setProfileForm({ ...profileForm, position: e.target.value })}
                                                    className={`w-full bg-black border rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-colors ${!isEditingProfile ? 'border-white/5 text-gray-400' : 'border-white/20'}`}
                                                />
                                            </div>
                                        </div>
                                        {/* Index */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">Index Number</label>
                                            <div className="relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                                <input
                                                    disabled={!isEditingProfile}
                                                    value={profileForm.indexNumber}
                                                    onChange={e => setProfileForm({ ...profileForm, indexNumber: e.target.value })}
                                                    className={`w-full bg-black border rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-colors ${!isEditingProfile ? 'border-white/5 text-gray-400' : 'border-white/20'}`}
                                                />
                                            </div>
                                        </div>
                                        {/* Grade */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-400">Grade</label>
                                            <div className="relative">
                                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                                <input
                                                    disabled={!isEditingProfile}
                                                    value={profileForm.grade}
                                                    onChange={e => setProfileForm({ ...profileForm, grade: e.target.value })}
                                                    className={`w-full bg-black border rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-colors ${!isEditingProfile ? 'border-white/5 text-gray-400' : 'border-white/20'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isEditingProfile && (
                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <Save className="w-5 h-5" /> Save Changes
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: ID VAULT --- */}
                    {activeTab === 'id' && (
                        <motion.div
                            key="id"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center min-h-[50vh]"
                        >
                            <div className={`w-full max-w-lg p-10 rounded-3xl text-center relative overflow-hidden border transition-all ${userData?.isIdUnlocked
                                    ? 'bg-gradient-to-b from-gray-900 to-black border-green-500/30'
                                    : 'bg-black border-red-500/30 dashed-border'
                                }`}>
                                {userData?.isIdUnlocked ? (
                                    <>
                                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                            <Shield className="w-12 h-12 text-green-400" />
                                        </div>
                                        <h3 className="text-3xl font-black text-white mb-2">ACCESS GRANTED</h3>
                                        <p className="text-gray-400 mb-8">Your secure digital identity is active.</p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(RoutePath.GENERATE_ID);
                                            }}
                                            className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                                        >
                                            OPEN ID GENERATOR <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="block">
                                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 animate-pulse">
                                            <Lock className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Restricted Area</h3>
                                        <p className="text-gray-400 text-sm mb-8">
                                            This vault contains your Official NCSS Premium ID Card.
                                            <br />Enter the <strong>Universal ID Gen Code</strong> to unlock it.
                                        </p>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                className="w-full bg-black border border-white/20 rounded-xl p-4 text-center text-xl font-mono tracking-[0.2em] focus:border-red-500 outline-none uppercase text-white placeholder-gray-700"
                                                placeholder="ENTER CODE"
                                                value={accessCodeInput}
                                                onChange={e => setAccessCodeInput(e.target.value)}
                                            />
                                            {unlockError && <div className="text-red-500 font-bold text-sm flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> {unlockError}</div>}
                                            <button
                                                type="button"
                                                onClick={(e) => handleUnlockId(e)} // Explicitly separate click logic
                                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Unlock className="w-5 h-5" /> UNLOCK VAULT
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* --- TAB: MESSAGES --- */}
                    {activeTab === 'messages' && (
                        <motion.div
                            key="messages"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* Send Form */}
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Send className="text-blue-500" /> Compose Message
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors"
                                        placeholder="Subject / Title"
                                        value={msgTitle}
                                        onChange={e => setMsgTitle(e.target.value)}
                                    />
                                    <textarea
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none h-40 resize-none transition-colors"
                                        placeholder="Type your message to the administration..."
                                        value={msgDesc}
                                        onChange={e => setMsgDesc(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendMessage}
                                        disabled={sendingMsg}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {sendingMsg ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 h-[500px] flex flex-col">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <MessageSquare className="text-gray-400" /> History
                                </h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                                            <p>No messages sent yet.</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div key={msg.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 group hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-white text-sm line-clamp-1">{msg.title}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${msg.status === 'read' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>{msg.status}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{msg.description}</p>
                                                <div className="flex justify-between items-center text-[10px] text-gray-500">
                                                    <span>{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleDateString() : 'Just now'}</span>
                                                    <button type="button" onClick={(e) => handleDeleteMessage(msg.id, e)} className="hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* --- MOBILE NAVIGATION (Fixed Bottom) --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 p-4 flex justify-between z-50 pb-8">
                {[
                    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'id', label: 'ID Card', icon: Shield },
                    { id: 'messages', label: 'Chat', icon: MessageSquare },
                ].map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={(e) => switchTab(item.id as Tab, e)}
                        className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-red-500' : 'text-gray-500'}`}
                    >
                        <item.icon className="w-6 h-6" /> <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>

        </div>
    );
};

export default MemberDashboard;
