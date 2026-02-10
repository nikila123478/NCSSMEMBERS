import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { ContentItem } from '../types';
import { FileText, Download, Calendar, ExternalLink } from 'lucide-react';

const News: React.FC = () => {
    const [news, setNews] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch news sorted by date if possible, otherwise client-side sort
                const q = query(collection(db, 'news'), orderBy('date', 'desc'));
                // Note: orderBy requires an index if fields are complex, falling back to simple fetch if index missing is handled by try/catch usually, 
                // but for now let's assume simple fetch if query fails or just fetch all and sort.
                // To be safe and simple without index setup:
                const querySnapshot = await getDocs(collection(db, 'news'));
                const newsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ContentItem[];

                // Sort client side to avoid index requirement for now
                newsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setNews(newsData);
            } catch (error) {
                console.error("Error fetching news: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen live-red-bg font-outfit text-white pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">

                {/* HEADER */}
                <div className="mb-16 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-2 px-4 rounded-full bg-red-900/30 border border-red-800/50 text-red-400 text-sm font-bold mb-4 uppercase tracking-widest"
                    >
                        Transmission Log
                    </motion.div>
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black mb-4 tracking-tighter"
                    >
                        LATEST <span className="text-red-600">UPDATES</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto"
                    >
                        Scientific breakthroughs, society announcements, and upcoming events from the NCSS team.
                    </motion.p>
                </div>

                {/* NEWS GRID */}
                <div className="space-y-8">
                    {news.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-white/5 backdrop-blur-sm">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No transmissions received yet.</p>
                        </div>
                    ) : (
                        news.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ y: 50, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:border-red-500/30 transition-colors group"
                            >
                                <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                                    {/* Image (Optional) */}
                                    {item.imageUrl && (
                                        <div className="w-full md:w-1/3 aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 shrink-0">
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3 text-sm text-red-400 font-bold uppercase tracking-wider">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            {item.category && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                    <span className="text-gray-400">{item.category}</span>
                                                </>
                                            )}
                                        </div>

                                        <h2 className="text-2xl font-bold text-white group-hover:text-red-500 transition-colors">
                                            {item.title}
                                        </h2>

                                        <p className="text-gray-400 leading-relaxed">
                                            {item.description}
                                        </p>

                                        {/* Downloads Section */}
                                        {item.downloadLinks && item.downloadLinks.length > 0 && (
                                            <div className="pt-4 flex flex-wrap gap-3">
                                                {item.downloadLinks.map((link) => (
                                                    <a
                                                        key={link.id}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg border border-red-600/20 transition-all font-bold text-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        {link.label || "Download File"}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Legacy PDF Link Support */}
                                        {item.pdfUrl && (
                                            <div className="pt-4">
                                                <a
                                                    href={item.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-all font-bold text-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    View Attached PDF
                                                </a>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default News;
