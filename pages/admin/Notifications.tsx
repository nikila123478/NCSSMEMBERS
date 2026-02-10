import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { ContactMessage, Message } from '../../types';
import { Mail, Trash2, Check, Clock, User, MessageSquare } from 'lucide-react';

type NotificationItem = (ContactMessage | Message) & { type: 'contact' | 'feedback' };

const Notifications: React.FC = () => {
    const [items, setItems] = useState<NotificationItem[]>([]);

    // Better Approach: 2 Listeners, 2 States, Merge on Render
    const [contactMsgs, setContactMsgs] = useState<NotificationItem[]>([]);
    const [feedbackMsgs, setFeedbackMsgs] = useState<NotificationItem[]>([]);

    useEffect(() => {
        const q1 = query(collection(db, 'contact_messages'), orderBy('timestamp', 'desc'));
        const unsub1 = onSnapshot(q1, (snap) => {
            setContactMsgs(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'contact' } as NotificationItem)));
        });

        const q2 = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
        const unsub2 = onSnapshot(q2, (snap) => {
            setFeedbackMsgs(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'feedback' } as NotificationItem)));
        });

        return () => { unsub1(); unsub2(); };
    }, []);

    const allItems = [...contactMsgs, ...feedbackMsgs].sort((a, b) => {
        const t1 = a.timestamp?.seconds || 0;
        const t2 = b.timestamp?.seconds || 0;
        return t2 - t1;
    });

    const markAsRead = async (id: string, currentStatus: boolean | 'read' | 'unread', type: 'contact' | 'feedback') => {
        const collectionName = type === 'contact' ? 'contact_messages' : 'messages';
        // Logic: Contact uses boolean readStatus, Message uses string status
        const isRead = type === 'contact' ? currentStatus === true : currentStatus === 'read';

        if (isRead) return;

        try {
            const updateData = type === 'contact' ? { readStatus: true } : { status: 'read' };
            await updateDoc(doc(db, collectionName, id), updateData);
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteMessage = async (id: string, type: 'contact' | 'feedback') => {
        if (window.confirm("Are you sure you want to delete this transmission?")) {
            const collectionName = type === 'contact' ? 'contact_messages' : 'messages';
            try {
                await deleteDoc(doc(db, collectionName, id));
            } catch (error) {
                console.error("Error deleting message:", error);
            }
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Unknown Time';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className="max-w-4xl mx-auto p-6 text-white animate-fade-in">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
                <div className="p-3 bg-red-600/20 rounded-full border border-red-500/30">
                    <Mail className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <span className="block text-2xl">Unified Inbox</span>
                    <span className="block text-sm font-normal text-gray-400">Manage all communications</span>
                </div>
            </h2>

            <div className="space-y-4">
                {allItems.length === 0 ? (
                    <div className="text-gray-500 text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No new transmissions received.</p>
                    </div>
                ) : (
                    allItems.map((msg) => {
                        const isRead = msg.type === 'contact'
                            ? (msg as ContactMessage).readStatus
                            : (msg as Message).status === 'read';

                        const senderName = msg.type === 'contact' ? (msg as ContactMessage).senderName : (msg as Message).userName;
                        const subInfo = msg.type === 'contact' ? (msg as ContactMessage).senderEmail : (msg as Message).title;
                        const body = msg.type === 'contact' ? (msg as ContactMessage).messageBody : (msg as Message).description;
                        const photo = msg.type === 'feedback' ? (msg as Message).userPhoto : null;

                        return (
                            <div
                                key={msg.id}
                                className={`p-6 rounded-2xl border transition-all ${isRead
                                    ? 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'
                                    : 'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Sender Info */}
                                    <div className="flex items-start gap-4 md:w-56 flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                            {photo ? (
                                                <img src={photo} alt={senderName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {msg.type === 'contact' ? (
                                                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">PUBLIC</span>
                                                ) : (
                                                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">MEMBER</span>
                                                )}
                                                {!isRead && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">NEW</span>}
                                            </div>
                                            <h3 className="font-bold text-white truncate">{senderName}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" /> {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-400 text-sm font-bold mb-2">{subInfo}</p>
                                        <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                            {body}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col gap-2 justify-end">
                                        <button
                                            onClick={() => markAsRead(msg.id, isRead, msg.type)}
                                            title="Mark as Read"
                                            className={`p-2 rounded-lg transition-colors ${isRead ? 'text-gray-600 hover:text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'}`}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteMessage(msg.id, msg.type)}
                                            title="Delete"
                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Notifications;
