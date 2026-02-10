import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2 } from 'lucide-react';

import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { CMSData } from '../types';

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const [loadingMap, setLoadingMap] = useState(true);
    const [contactInfo, setContactInfo] = useState<CMSData | null>(null);

    // Default Fallback URL (Nalanda College)
    const DEFAULT_MAP_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.788788487978!2d79.87521367448286!3d6.915850993083731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2597495058771%3A0x633390d408542d99!2sNalanda%20College!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk";

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'homepage');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as CMSData;
                    setContactInfo(data);
                    setMapUrl(data.googleMapUrl || DEFAULT_MAP_URL);
                } else {
                    setMapUrl(DEFAULT_MAP_URL);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                setMapUrl(DEFAULT_MAP_URL);
            } finally {
                setLoadingMap(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            await addDoc(collection(db, 'contact_messages'), {
                senderName: formData.name,
                senderEmail: formData.email,
                subject: formData.subject, // Optional extra field
                messageBody: formData.message,
                timestamp: serverTimestamp(),
                readStatus: false
            });
            alert("Message transmitted successfully to NCSS Mainframe.");
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Transmission failed. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 font-outfit relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-red-800/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[10%] left-[10%] w-[20%] h-[20%] bg-red-600/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <span className="text-red-500 font-bold tracking-[0.2em] uppercase text-sm mb-2 block">Get In Touch</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6">Establish <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Connection</span></h1>
                    {contactInfo?.contactIntro && (
                        <p className="text-gray-400 max-w-2xl mx-auto">{contactInfo.contactIntro}</p>
                    )}
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* LEFT COLUMN: Contact Info & Map */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Info Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <Mail className="w-6 h-6 text-red-500 mb-4" />
                                <h4 className="font-bold text-lg mb-1">Email Us</h4>
                                <p className="text-gray-400 text-sm">{contactInfo?.officialEmail || "info@ncss.org"}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <Phone className="w-6 h-6 text-red-500 mb-4" />
                                <h4 className="font-bold text-lg mb-1">Call Us</h4>
                                <p className="text-gray-400 text-sm">{contactInfo?.phoneNumber1 || "+94 11 234 5678"}</p>
                                {contactInfo?.phoneNumber2 && <p className="text-gray-400 text-sm">{contactInfo.phoneNumber2}</p>}
                            </div>
                        </div>

                        {/* Address Card */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <MapPin className="text-red-500" /> Headquarters
                            </h3>
                            <p className="text-gray-400 leading-relaxed pl-9 mb-6">
                                {contactInfo?.addressLine1 || "Nalanda College Science Society"}<br />
                                {contactInfo?.addressLine2 || "Nalanda College"}<br />
                                {contactInfo?.city || "Colombo 10, Sri Lanka"}
                            </p>
                            {contactInfo?.openingHours && (
                                <p className="text-red-400 text-sm font-bold pl-9">
                                    {contactInfo.openingHours}
                                </p>
                            )}

                            {/* GOOGLE MAPS INTEGRATION */}
                            <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)] bg-gray-900 relative group mt-6">
                                {loadingMap && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500">
                                        <Loader2 className="animate-spin w-8 h-8" />
                                    </div>
                                )}
                                <iframe
                                    src={mapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(100%)' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="group-hover:filter-none transition-all duration-500"
                                ></iframe>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl h-fit"
                    >
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <MessageSquare className="text-red-500" /> Send a Transmission
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Designation / Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                        placeholder="Dr. Smith"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comms Channel / Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                    placeholder="Inquiry regarding..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message Data</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                                    placeholder="Enter your message..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 ${sending ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {sending ? 'Transmitting...' : 'Send Transmission'} <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>

        </div>
    );
};

export default Contact;
