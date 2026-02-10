import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, XCircle, Clock, CheckSquare, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useStore } from '../context/StoreContext';

interface Project {
    id: string;
    title: string;
    estimatedCost: number;
    description: string;
    date: string;
    status: 'pending' | 'pending_completion' | 'active' | 'completed' | 'rejected';
    createdByName: string;
}

const RequestsAdmin: React.FC = () => {
    const { currentUser } = useStore();
    const [approvalRequests, setApprovalRequests] = useState<Project[]>([]);
    const [completionRequests, setCompletionRequests] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch PENDING APPROVALS - STRICTLY 'pending'
        const q1 = query(collection(db, 'project_requests'), where('status', '==', 'pending'));
        const unsub1 = onSnapshot(q1, (snapshot) => {
            setApprovalRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
        });

        // Fetch PENDING COMPLETION
        const q2 = query(collection(db, 'project_requests'), where('status', '==', 'pending_completion'));
        const unsub2 = onSnapshot(q2, (snapshot) => {
            setCompletionRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
            setLoading(false);
        });

        return () => { unsub1(); unsub2(); };
    }, []);

    const handleApprove = async (id: string, project: any) => {
        console.log("Attempting to approve:", project); // Debug log

        try {
            // 1. Validation Check
            if (!project) throw new Error("Project data is missing!");

            // Handle missing amount (For old test data)
            const rawAmount = project.estimatedCost || project.amount || 0; // Adapted to support estimatedCost
            const amountValue = parseFloat(rawAmount);

            // Handle missing title
            const projectTitle = project.title || "Untitled Project";

            // 2. Update Status
            const projectRef = doc(db, "project_requests", id);
            await updateDoc(projectRef, {
                status: "approved", // Using 'approved' as per strict prompt instruction, though 'active' was previous.
                approvedAt: serverTimestamp()
            });

            // 3. Create Expense Record
            await addDoc(collection(db, "funds"), {
                type: "expense",
                title: "Project: " + projectTitle, // Title field as per prompt
                description: project.description || "Approved Funding",
                amount: isNaN(amountValue) ? 0 : amountValue, // Safe Fallback
                category: "Projects",
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            alert("✅ Success! Project Approved.");

            // Reload page to reflect changes (Temporary fix for state update)
            window.location.reload();

        } catch (error: any) {
            console.error("Approval Error:", error);
            // THIS IS THE IMPORTANT PART: SHOW THE REAL ERROR
            alert("❌ Error: " + error.message);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Reject this proposal?")) return;
        try {
            await updateDoc(doc(db, 'project_requests', id), { status: 'rejected' });
        } catch (e) { console.error(e); }
    };

    const handleVerifyCompletion = async (project: Project) => {
        if (!confirm(`Verify completion of "${project.title}"?`)) return;
        try {
            await updateDoc(doc(db, 'project_requests', project.id), {
                status: 'completed',
                completedAt: serverTimestamp()
            });
            alert("Project Verified as Complete!");
        } catch (error) {
            console.error("Error verifying:", error);
            alert("Failed to verify.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-white">
            <div>
                <h2 className="text-3xl font-black text-white text-glow">Project Approvals</h2>
                <p className="text-gray-400">Manage funding requests and verifications.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* COLUMN 1: NEW PROPOSALS */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <Clock className="w-5 h-5 text-orange-400" /> New Proposals
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">{approvalRequests.length}</span>
                    </h3>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {approvalRequests.length === 0 && <div className="text-gray-500 text-center py-8">No new proposals.</div>}
                        {approvalRequests.map(req => (
                            <div key={req.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-orange-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-white">{req.title}</h4>
                                    <span className="font-black text-orange-400">{formatCurrency(req.estimatedCost)}</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">by {req.createdByName}</p>
                                <p className="text-sm text-gray-300 bg-black/30 p-2 rounded mb-4">{req.description}</p>

                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(req.id, req)} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button onClick={() => handleReject(req.id)} className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 font-bold rounded-lg transition-colors">
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: COMPLETION VERIFICATION */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <CheckSquare className="w-5 h-5 text-blue-400" /> Verify Completion
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{completionRequests.length}</span>
                    </h3>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {completionRequests.length === 0 && <div className="text-gray-500 text-center py-8">No pending verifications.</div>}
                        {completionRequests.map(req => (
                            <div key={req.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-white">{req.title}</h4>
                                    <span className="font-black text-green-400">Active</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-900/20 p-2 rounded mb-4 border border-blue-500/20">
                                    <AlertCircle className="w-4 h-4" /> Project marked complete by Admin.
                                </div>

                                <button onClick={() => handleVerifyCompletion(req)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20">
                                    <CheckSquare className="w-4 h-4" /> Verify & Close
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestsAdmin;
