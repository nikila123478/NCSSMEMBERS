import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { db } from '../utils/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Trash2, Calendar, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { EventItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const EventManager: React.FC = () => {
    const { currentUser } = useStore();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    useEffect(() => {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as EventItem[];
            setEvents(fetchedEvents);
        });
        return () => unsubscribe();
    }, []);

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !description) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'events'), {
                title,
                date,
                description,
                imageUrl,
                createdAt: serverTimestamp()
            });
            // Reset form
            setTitle('');
            setDate('');
            setDescription('');
            setImageUrl('');
        } catch (error) {
            console.error("Error adding event: ", error);
            alert("Failed to add event.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteDoc(doc(db, 'events', id));
            } catch (error) {
                console.error("Error deleting event: ", error);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-white">
            <div>
                <h2 className="text-3xl font-black text-white text-glow">Event Management</h2>
                <p className="text-gray-400">Schedule and manage upcoming society events.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* EVENT FORM (Super Admin Only) */}
                {isSuperAdmin ? (
                    <div className="lg:col-span-1">
                        <div className="glass-panel p-6 rounded-2xl sticky top-24">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-red-500" /> New Event
                            </h3>
                            <form onSubmit={handleAddEvent} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        className="w-full glass-input p-3 rounded-lg font-bold"
                                        placeholder="e.g. Annual Science Day"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full glass-input p-3 rounded-lg" // datetime-local has native UI, might need custom styling tweaks
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Image URL (Optional)</label>
                                    <div className="flex items-center gap-2 glass-input border rounded-lg p-3">
                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                                            placeholder="https://..."
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full glass-input p-3 rounded-lg h-32 resize-none"
                                        placeholder="Event details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Schedule Event
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-1">
                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-yellow-500">
                            <h3 className="text-lg font-bold text-white mb-2">Read Only Mode</h3>
                            <p className="text-gray-400 text-sm">You can view upcoming events here. Only Super Admins can create or delete events.</p>
                        </div>
                    </div>
                )}

                {/* EVENT LIST */}
                <div className="lg:col-span-2 space-y-4">
                    {events.length === 0 ? (
                        <div className="glass-panel p-12 rounded-2xl text-center text-gray-500">
                            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>No upcoming events scheduled.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {events.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="glass-panel p-5 rounded-xl flex gap-5 group relative overflow-hidden"
                                >
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 w-16 h-16 bg-white/5 rounded-lg flex flex-col items-center justify-center border border-white/10">
                                        <span className="text-xs text-red-400 font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-2xl font-black text-white">{new Date(event.date).getDate()}</span>
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <h4 className="text-lg font-bold text-white truncate">{event.title}</h4>
                                        <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(event.date).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
                                    </div>

                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

            </div>
        </div>
    );
};

export default EventManager;
