import React, { useState, useEffect } from 'react';

import { db } from '../utils/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { Shield, CheckCircle, TrendingUp, Clock, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
    id: string;
    title: string;
    estimatedCost: number;
    description: string;
    date: string;
    status: 'pending' | 'approved' | 'active' | 'completed' | 'pending_completion';
}

const Transparency: React.FC = () => {
    // 1. Hooks & Context
    const navigate = useNavigate();
    const { currentUser, access } = useStore(); // Single declaration

    // 2. Page Data State
    const [balance, setBalance] = useState(0);
    const [projects, setProjects] = useState<Project[]>([]);

    // 3. UI States
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [verifying, setVerifying] = useState(true);

    // --- GATEKEEPER LOGIC ---
    useEffect(() => {
        let isMounted = true;

        const checkAccess = async () => {
            // A. Authentication Check
            if (!currentUser) {
                // If not logged in, we let the app/routing handle it, 
                // but just in case, we stop verifying to show fallback or redirect.
                if (isMounted) setVerifying(false);
                return;
            }

            // B. Security Clearance Check
            // 1. Admin Bypass
            const isAdmin = ['SUPER_ADMIN', 'MEMBER_ADMIN', 'super_admin', 'admin'].includes(currentUser.role || '');

            // 2. Session Storage Check (Stability)
            const isUnlocked = sessionStorage.getItem('transparency_access_unlocked') === 'true';

            if (isAdmin || isUnlocked) {
                // ACCESS GRANTED
                if (isMounted) {
                    setAuthorized(true);
                    setVerifying(false);
                }
            } else {
                // ACCESS DENIED -> KICK TO HOME
                console.warn("⛔ Unauthorized Access to Transparency. Redirecting...");
                setVerifying(true); // Keep showing loader/msg
                setTimeout(() => navigate('/'), 1000);
            }
        };

        // Small delay to ensure context/session is ready
        const timer = setTimeout(checkAccess, 100);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [currentUser, navigate]);


    // --- DATA FETCHING (Only if Authorized) ---
    useEffect(() => {
        if (!authorized) return;

        console.log("🔓 Verified. Fetching Transparency Data...");

        // 1. Balance
        const fundsQ = query(collection(db, 'funds'));
        const unsubscribeFunds = onSnapshot(fundsQ, (snapshot) => {
            let bal = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const type = data.type?.toLowerCase() || 'expense';
                const amount = Number(data.amount) || 0;
                if (type === 'income') bal += amount;
                else bal -= amount;
            });
            setBalance(bal);
        });

        // 2. Projects
        const projectsRef = collection(db, 'project_requests');
        const projectsQ = query(
            projectsRef,
            where('status', '==', 'approved'),
            orderBy('date', 'desc')
        );

        const unsubscribeProjects = onSnapshot(projectsQ, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
            setProjects(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching projects:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeFunds();
            unsubscribeProjects();
        };

    }, [authorized]);

    // --- RENDER HELPERS ---

    if (verifying) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-10 h-10 animate-spin text-red-600" />
                    <p className="text-gray-400 text-sm tracking-widest uppercase">Verifying Clearance...</p>
                </div>
            </div>
        );
    }

    // Double protection: If render happens before redirect
    if (!currentUser || !authorized) {
        return null;
    }

    return (
        <div className="min-h-screen live-red-bg text-white flex flex-col font-outfit">
            <div className="pt-32 pb-20 px-6 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto text-center">
                    <Shield className="w-16 h-16 text-red-600 mx-auto mb-6" />
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                        Financial <span className="text-red-600">Transparency</span>
                    </h1>
                    <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-12 font-light">
                        We believe in open science and open books. Every rupee entrusted to the NCSS is tracked, managed, and audited publicly.
                    </p>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-xl mx-auto border border-white/10 shadow-lg">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Current Public Funds</p>
                        <div className={`text-6xl font-black ${balance >= 0 ? "text-white" : "text-red-500"}`}>
                            {formatCurrency(balance)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-24 flex-grow w-full">
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-6">Where the money goes</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="p-3 bg-red-600/20 rounded-lg text-red-500 h-fit"><CheckCircle className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-lg text-white">Board Verified</h4><p className="text-sm text-gray-300">Every project is reviewed by the Super Admin.</p></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="p-3 bg-red-600/20 rounded-lg text-red-500 h-fit"><TrendingUp className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-lg text-white">Impact Focused</h4><p className="text-sm text-gray-300">Investments target maximum educational impact.</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-white">
                        <div className="p-8 border-b border-white/10">
                            <h3 className="text-2xl font-black text-white">Approved Projects</h3>
                            <p className="text-gray-400">Recently funded initiatives.</p>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {loading && <div className="p-8 text-center text-gray-400 animate-pulse">Loading records...</div>}

                            {!loading && projects.length === 0 && (
                                <div className="p-8 text-center border-dashed border-2 border-gray-100 m-4 rounded-xl">
                                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400 font-bold">No approved projects yet.</p>
                                </div>
                            )}

                            {projects.map(p => (
                                <div key={p.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-gray-900">{p.title || "Untitled Project"}</h4>
                                        <span className="font-black text-red-600">
                                            {formatCurrency(p.estimatedCost || (p as any).amount || 0)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{p.description || "No description provided."}</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                        <Clock className="w-3 h-3" /> Funded on {new Date(p.date).toLocaleDateString()}
                                        {p.status === 'completed' && <span className="text-green-600 ml-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Transparency;