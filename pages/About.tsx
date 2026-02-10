import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CMSData } from '../types';

import { Loader2, Target, Eye, Clock, Quote } from 'lucide-react';

const About: React.FC = () => {
    const [data, setData] = useState<CMSData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, 'settings', 'homepage');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setData(docSnap.data() as CMSData);
                }
            } catch (err) {
                console.error("Error fetching about data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10 text-red-600" /></div>;
    }

    const heroImages = data?.aboutImages || [];

    return (
        <div className="min-h-screen bg-black text-white font-outfit overflow-x-hidden">

            {/* HERO SECTION */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-red-900/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* Background Grid/Effect */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10 text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <h1 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter uppercase">
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">About</span> <span className="text-red-600">US</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto uppercase tracking-widest">
                            The Intellectual Core of Nalanda
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-20 space-y-24">

                {/* 1. WHO WE ARE (Main Intro) */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-red-500 mb-2">
                            <div className="h-px w-10 bg-red-500" />
                            <span className="uppercase font-bold tracking-widest text-sm">Who We Are</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                            Pioneering Science &<br /> Innovation Since 2004
                        </h2>
                        <div className="text-gray-300 leading-relaxed text-lg text-justify border-l-2 border-red-500/30 pl-6">
                            {data?.mainIntro || "Loading content..."}
                        </div>
                    </div>

                    {/* Dynamic Image Grid from About Images */}
                    <div className="grid grid-cols-2 gap-4">
                        {heroImages.slice(0, 4).map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                className={`rounded-2xl overflow-hidden aspect-square border border-white/10 ${idx % 2 === 1 ? 'mt-8' : ''}`}
                            >
                                <img src={img} alt="About Us" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                            </motion.div>
                        ))}
                        {heroImages.length === 0 && (
                            <div className="col-span-2 h-64 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-600 italic border border-white/5">
                                Add images in Site Editor
                            </div>
                        )}
                    </div>
                </motion.section>


                {/* 2. VISION & MISSION */}
                <motion.section
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    className="grid md:grid-cols-2 gap-8"
                >
                    {/* Vision */}
                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-colors overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                            <Eye className="w-32 h-32 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-red-600/30">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Our Vision</h3>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                {data?.visionText || "Our vision statement goes here..."}
                            </p>
                        </div>
                    </div>

                    {/* Mission */}
                    <div className="group relative bg-white/5 border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-colors overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                            <Target className="w-32 h-32 text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-600/30">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                {data?.missionText || "Our mission statement goes here..."}
                            </p>
                        </div>
                    </div>
                </motion.section>


                {/* 3. HISTORY / LEGACY */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-12">
                        <div className="md:w-1/3">
                            <div className="flex items-center gap-3 mb-4 text-red-500 font-bold uppercase tracking-widest">
                                <Clock className="w-5 h-5" /> Our Journey
                            </div>
                            <h2 className="text-4xl font-black mb-6">A Legacy of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">Excellence</span></h2>
                            <p className="text-gray-500">From humble beginnings to a powerhouse of scientific innovation.</p>
                        </div>
                        <div className="md:w-2/3">
                            <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                                {data?.historyText || "History content coming soon..."}
                            </div>
                        </div>
                    </div>
                </motion.section>


                {/* 4. PRESIDENT'S MESSAGE (Optional) */}
                {data?.presidentMessage && (
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <Quote className="w-12 h-12 text-red-500 mx-auto mb-6 opacity-50" />
                        <h3 className="text-2xl font-bold mb-6">President's Message</h3>
                        <p className="text-xl md:text-2xl text-gray-300 italic font-light leading-relaxed">
                            "{data.presidentMessage}"
                        </p>
                    </motion.section>
                )}

                {/* 5. MEET OUR TEAM */}
                {data && Array.isArray(data.teamMembers) && data.teamMembers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="py-12 border-t border-white/10"
                    >
                        <h2 className="text-3xl md:text-4xl font-black text-center mb-16 uppercase tracking-wider">
                            Meet <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">Our Team</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 px-4">
                            {data.teamMembers.map((member) => (
                                <div key={member.id || Math.random()} className="flex flex-col items-center text-center group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="relative w-40 h-40 mb-6 rounded-full border-2 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:scale-105 transition-transform duration-300 overflow-hidden bg-black">
                                        <div className="absolute inset-0 bg-red-500/10 group-hover:bg-transparent transition-colors z-10" />
                                        {member.imageUrl ? (
                                            <img
                                                src={member.imageUrl}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-red-500 text-xs">No Img</div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-500 transition-colors uppercase">{member.name || "Member Name"}</h3>
                                    <p className="text-red-400 text-sm font-mono opacity-80">{member.role || "Role"}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>

        </div>
    );
};

export default About;
