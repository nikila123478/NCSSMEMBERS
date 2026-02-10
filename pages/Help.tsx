import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle, AlertCircle } from 'lucide-react';

import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CMSData, FAQItem } from '../types';

const Help: React.FC = () => {
    const [data, setData] = useState<CMSData | null>(null);
    const [loading, setLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, 'settings', 'homepage');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setData(docSnap.data() as CMSData);
                }
            } catch (err) {
                console.error("Error fetching help data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleFaq = (id: string) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    const faqList = data?.faqList || [];
    const helpTitle = data?.helpTitle || "Support Center";
    const helpSubtitle = data?.helpSubtitle || "Access the knowledge base or request assistance.";

    return (
        <div className="min-h-screen bg-black text-white pt-24 font-outfit relative overflow-hidden">

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 mb-20">

                {/* HERO */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-red-600/10 rounded-full mb-6 border border-red-600/20 text-red-500">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-4">
                        {helpTitle.split(' ').slice(0, -1).join(' ')} <span className="text-red-600">{helpTitle.split(' ').slice(-1)}</span>
                    </h1>
                    <p className="text-gray-400 text-lg">{helpSubtitle}</p>
                </motion.div>

                {/* SEARCH MOCKUP (Optional visual) */}
                <div className="mb-12 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-red-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-black border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-gray-500 font-mono text-sm">Search Protocol 7...</span>
                    </div>
                </div>

                {/* FAQ LIST */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-6 text-green-500 font-mono text-xs uppercase tracking-widest">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        SYSTEM_LOGS / FAQ
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 animate-pulse">Initializing Knowledge Base...</div>
                    ) : (
                        <>
                            {faqList.length > 0 ? (
                                faqList.map((faq) => (
                                    <motion.div
                                        key={faq.id}
                                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === faq.id ? 'bg-white/10 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                    >
                                        <button
                                            onClick={() => toggleFaq(faq.id)}
                                            className="w-full p-6 text-left flex items-center justify-between gap-4"
                                        >
                                            <span className="font-bold text-lg md:text-xl">{faq.question}</span>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180 text-red-500' : 'text-gray-500'}`} />
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === faq.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 pt-0 text-gray-300 leading-relaxed border-t border-white/5 mt-2">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 border-dashed">
                                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-500 mb-2">No Data Found</h3>
                                    <p className="text-gray-600">The knowledge base is currently empty.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* CONTACT CTA */}
                <div className="mt-20 text-center">
                    <p className="text-gray-500 mb-6">Still need assistance?</p>
                    <a href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                        <MessageCircle className="w-5 h-5" /> Contact Support
                    </a>
                </div>

            </div>

        </div>
    );
};

export default Help;
