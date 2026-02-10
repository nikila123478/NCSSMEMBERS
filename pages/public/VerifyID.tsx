import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { IDCard, RoutePath } from '../../types';
import IDCard3D from '../../components/IDCard3D';
import { Loader, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyID: React.FC = () => {
    const { uid } = useParams<{ uid: string }>();
    const [card, setCard] = useState<IDCard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCard = async () => {
            if (!uid) {
                setError("Invalid Verification URL.");
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'idCards', uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCard(docSnap.data() as IDCard);
                } else {
                    setError("ID Card not found. It may have been revoked or does not exist.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("System error during verification. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchCard();
    }, [uid]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white">
                <Loader className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-gray-400 tracking-widest uppercase text-sm">Verifying Credentials...</p>
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-black p-6 text-center">
                <div className="p-6 rounded-full bg-red-900/20 mb-6 border border-red-500/30">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
                <p className="text-red-400 max-w-md mb-8">{error}</p>
                <Link
                    to={RoutePath.HOME}
                    className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    // Calculate Member Since year from generatedAt or fallback
    const memberSince = card.generatedAt ? new Date(card.generatedAt).getFullYear() : '2024';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-6">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black pointer-events-none" />
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="flex items-center gap-2 mb-8 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-bold tracking-wider text-sm uppercase">Official Verified Member</span>
                </div>

                <IDCard3D card={card} />

                <div className="mt-10 text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">{card.fullName}</h2>
                    <p className="text-gray-400 uppercase tracking-widest text-sm">{card.position}</p>
                    <div className="inline-block mt-4 px-4 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-500 font-mono">
                        ID: {card.memberId}
                    </div>
                </div>

                <footer className="mt-12 text-center">
                    <p className="text-white/20 text-xs uppercase tracking-[0.2em] mb-4">Science Society of Nalanda College</p>
                    <Link
                        to={RoutePath.HOME}
                        className="text-red-500 hover:text-red-400 text-sm font-bold transition-colors"
                    >
                        Visit Official Portal
                    </Link>
                </footer>
            </motion.div>
        </div>
    );
};

export default VerifyID;
