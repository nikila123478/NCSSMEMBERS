import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/firebase';
import { useStore } from '../context/StoreContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Send, User as UserIcon, MessageSquare, Shield, CheckSquare, Square, Users } from 'lucide-react';
import { User } from '../types';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    receiverId?: string;
    date: any;
    isBroadcast?: boolean;
}

const AdminChat: React.FC = () => {
    const { currentUser, users } = useStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [activeChat, setActiveChat] = useState<string>('BROADCAST');
    const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    // Filter Admins for selection (excluding self)
    const adminList = users.filter(u => u.role === 'MEMBER_ADMIN' && u.id !== currentUser?.id);

    // Users available for DM (Super Admins + Member Admins)
    const chatUsers = users.filter(u => (u.role === 'SUPER_ADMIN' || u.role === 'MEMBER_ADMIN') && u.id !== currentUser?.id);

    // Initialize Selection
    useEffect(() => {
        if (activeChat === 'BROADCAST') {
            // Default select all? Or none? Let's select all for convenience or let user choose.
            // Prompt says "Add a 'Select All' option". Let's start with empty or manual.
        }
    }, [activeChat]);

    useEffect(() => {
        if (!currentUser) return;

        let q;
        if (activeChat === 'BROADCAST') {
            // For Broadcast view, we might want to see previous broadcasts or just a "New Message" interface
            // The prompt implies a "Sending" interface, but let's show recent broadcasts if possible.
            // For now, consistent with previous logic: show messages where isBroadcast == true OR we can show recent batch logs?
            // To stick to constraints: "Loop through ALL selected Admin UIDs... Create separate message".
            // This means they are DMs technically.
            // So 'BROADCAST' view might just be the "Compose" view.
            // But let's keep fetching 'isBroadcast' for backward compatibility or general announcements if any.
            q = query(collection(db, 'chats'), where('isBroadcast', '==', true), orderBy('date', 'asc'));
        } else {
            q = query(collection(db, 'chats'), orderBy('date', 'asc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];

            // Client-side Filter
            const filtered = data.filter(m => {
                if (activeChat === 'BROADCAST') return m.isBroadcast === true;

                // DM Logic
                const isMeSender = m.senderId === currentUser.id;
                const isMeReceiver = m.receiverId === currentUser.id;
                const isThemSender = m.senderId === activeChat;
                const isThemReceiver = m.receiverId === activeChat;

                return (isMeSender && isThemReceiver) || (isThemSender && isMeReceiver);
            });

            setMessages(filtered);
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [activeChat, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => scrollToBottom(), [messages]);

    const toggleAdmin = (id: string) => {
        setSelectedAdmins(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedAdmins.length === adminList.length) setSelectedAdmins([]);
        else setSelectedAdmins(adminList.map(u => u.id));
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);

        try {
            if (activeChat === 'BROADCAST') {
                if (selectedAdmins.length === 0) {
                    alert("Please select at least one recipient.");
                    setSending(false);
                    return;
                }

                // Batch Send Logic
                const promises = selectedAdmins.map(receiverId => addDoc(collection(db, 'chats'), {
                    text: input,
                    senderId: currentUser?.id,
                    senderName: currentUser?.name || 'Super Admin',
                    receiverId: receiverId,
                    date: serverTimestamp(),
                    isBroadcast: false, // It's a direct message in batch
                    read: false
                }));

                await Promise.all(promises);
                alert(`Message sent to ${selectedAdmins.length} admins!`);
                setSelectedAdmins([]); // Reset selection
            } else {
                // Direct Message
                await addDoc(collection(db, 'chats'), {
                    text: input,
                    senderId: currentUser?.id,
                    senderName: currentUser?.name || 'Super Admin',
                    receiverId: activeChat,
                    date: serverTimestamp(),
                    isBroadcast: false,
                    read: false
                });
            }
            setInput('');
        } catch (error) {
            console.error("Error sending:", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden animate-fade-in">
            {/* Sidebar (Kept Light as per request to not touch pages/sidebar heavily, but this is inside the component) */}
            <div className="w-80 border-r border-gray-100 bg-gray-50 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-black text-gray-900">Messages</h3>
                    <p className="text-xs text-gray-500">Internal Admin Comms</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => setActiveChat('BROADCAST')}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors ${activeChat === 'BROADCAST' ? 'bg-black text-white shadow-lg' : 'hover:bg-white text-gray-600'}`}
                    >
                        <div className="p-2 bg-red-600 text-white rounded-lg"><Users className="w-4 h-4" /></div>
                        <div className="text-left">
                            <p className="font-bold text-sm">Batch Message</p>
                            <p className="text-[10px] opacity-70">Select Recipients</p>
                        </div>
                    </button>

                    <p className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2 px-2">Direct Messages</p>
                    {chatUsers.map(u => (
                        <button
                            key={u.id}
                            onClick={() => setActiveChat(u.id)}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat === u.id ? 'bg-white shadow-md border border-gray-100 text-black' : 'hover:bg-white text-gray-600'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                                {u.name[0]}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm truncate">{u.name}</p>
                                <p className="text-xs text-gray-400 truncate w-32">{u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area - DARK THEME FIX */}
            <div className="flex-1 flex flex-col bg-gray-900 relative">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black pointer-events-none" />

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between relative z-10 bg-gray-900/50 backdrop-blur-md">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                        {activeChat === 'BROADCAST' ? <><Users className="w-5 h-5 text-red-500" /> New Broadcast Message</> : users.find(u => u.id === activeChat)?.name || 'User'}
                    </h3>
                </div>

                {/* Messages List / Selection Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
                    {/* BATCH SELECTION UI */}
                    {activeChat === 'BROADCAST' && (
                        <div className="mb-6 p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Select Recipients</h4>
                                <button onClick={toggleAll} className="text-xs font-bold text-red-400 hover:text-red-300">
                                    {selectedAdmins.length === adminList.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {adminList.map(admin => (
                                    <button
                                        key={admin.id}
                                        onClick={() => toggleAdmin(admin.id)}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${selectedAdmins.includes(admin.id) ? 'bg-red-600/20 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                    >
                                        {selectedAdmins.includes(admin.id) ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4" />}
                                        <span className="text-xs font-bold truncate">{admin.name}</span>
                                    </button>
                                ))}
                                {adminList.length === 0 && <p className="text-gray-500 text-xs italic p-2">No admins found.</p>}
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    {messages.map(m => {
                        const isMe = m.senderId === currentUser?.id;
                        return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                                    {!isMe && <p className="text-[10px] font-bold text-gray-400 mb-1">{m.senderName}</p>}
                                    <p>{m.text}</p>
                                    <p className={`text-[10px] mt-2 text-right ${isMe ? 'text-red-200' : 'text-gray-500'}`}>
                                        {m.date ? new Date(m.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 relative z-10">
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <input
                            type="text"
                            className="flex-1 p-4 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 placeholder-gray-500 transition-all"
                            placeholder={activeChat === 'BROADCAST' ? `Message ${selectedAdmins.length} admins...` : "Type a message..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending}
                            className={`p-4 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
