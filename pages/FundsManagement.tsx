import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { Trash2, FileText, Download, Plus, AlertCircle, Loader2, Send, Save, CheckCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../utils/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

interface Transaction {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    date: string;
}

interface ProjectRequest {
    id: string;
    title: string;
    estimatedCost: number;
    description: string;
    date: string;
    status: 'draft' | 'pending' | 'active' | 'pending_completion' | 'completed' | 'rejected';
    userId: string; // Changed from createdBy to userId as per prompt
    createdByName: string;
}

const FundsManagement: React.FC = () => {
    const { currentUser } = useStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myProjects, setMyProjects] = useState<ProjectRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'transactions' | 'reports' | 'propose' | 'my-projects'>('transactions');

    // Transaction Form State (Super Admin)
    const [txForm, setTxForm] = useState({ amount: '', description: '', type: 'INCOME' as 'INCOME' | 'EXPENSE', date: new Date().toISOString().split('T')[0] });
    const [saving, setSaving] = useState(false);

    // Proposal State (Admin)
    const [proposal, setProposal] = useState({ title: '', cost: '', description: '', date: new Date().toISOString().split('T')[0] });

    // Report State
    const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
    const [reportMonth, setReportMonth] = useState(new Date().getMonth().toString());

    const isSuperAdmin = ['SUPER_ADMIN', 'super_admin'].includes(currentUser?.role || '');
    const isAdmin = ['MEMBER_ADMIN', 'admin'].includes(currentUser?.role || '');

    // 1. Fetch Transactions
    useEffect(() => {
        const q = query(collection(db, 'funds'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (sn) => setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))));
        return () => unsubscribe();
    }, []);

    // 2. Fetch My Projects (Admin Only)
    // 2. Fetch My Projects (Admin Only)
    useEffect(() => {
        if (!currentUser?.id) return;
        // Fetch ALL projects by this user (Drafts, Pending, etc.)
        const q = query(collection(db, 'project_requests'), where('userId', '==', currentUser.id), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (sn) => setMyProjects(sn.docs.map(d => ({ id: d.id, ...d.data() } as ProjectRequest))));
        return () => unsubscribe();
    }, [currentUser]);

    // Calculate Balance
    const totalBalance = transactions.reduce((acc, t) => {
        const amount = Number(t.amount) || 0;
        const type = t.type ? t.type.toLowerCase() : 'expense';
        return type === 'income' ? acc + amount : acc - amount;
    }, 0);

    const handleAddTransaction = async () => {
        if (!txForm.amount || !txForm.description) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'funds'), {
                amount: parseFloat(txForm.amount),
                type: txForm.type,
                description: txForm.description,
                date: txForm.date,
                createdAt: serverTimestamp()
            });
            setTxForm({ ...txForm, amount: '', description: '' });
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("Failed to save transaction.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (window.confirm("Are you sure?")) {
            await deleteDoc(doc(db, 'funds', id));
        }
    };

    // --- PROPOSAL HANDLERS ---
    const handleSaveDraft = async () => {
        const auth = getAuth(); // Direct Auth Access
        const user = auth.currentUser;

        if (!user) {
            alert("Security Error: You are not logged in. Please reload the page.");
            return;
        }

        console.log("Submitting Draft as User:", user.uid);

        if (!proposal.title || !proposal.cost) {
            alert("Please fill in Title and Cost.");
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'project_requests'), {
                title: proposal.title,
                estimatedCost: parseFloat(proposal.cost),
                budget: parseFloat(proposal.cost),
                description: proposal.description,
                date: proposal.date,
                status: 'draft',
                userId: user.uid, // CRITICAL: userId
                createdByName: user.displayName || user.email || 'Admin',
                createdAt: serverTimestamp(),
                adminId: user.uid
            });
            alert("Project saved as Draft!");
            setProposal({ title: '', cost: '', description: '', date: new Date().toISOString().split('T')[0] });
            setActiveTab('my-projects');
        } catch (error: any) {
            console.error("Error saving draft:", error);
            alert("Failed to save draft: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitProposal = async () => {
        const auth = getAuth(); // Direct Auth Access
        const user = auth.currentUser;

        if (!user) {
            alert("Security Error: You are not logged in. Please reload the page.");
            return;
        }

        console.log("Submitting Proposal as User:", user.uid);

        if (!proposal.title || !proposal.cost) {
            alert("Please fill in Title and Cost.");
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'project_requests'), {
                title: proposal.title,
                estimatedCost: parseFloat(proposal.cost),
                budget: parseFloat(proposal.cost),
                description: proposal.description,
                date: proposal.date,
                status: 'pending', // Explicitly 'pending'
                userId: user.uid, // CRITICAL: userId
                createdByName: user.displayName || user.email || 'Admin',
                createdAt: serverTimestamp(),
                adminId: user.uid
            });
            alert("Project sent to Super Admin for approval!");
            setProposal({ title: '', cost: '', description: '', date: new Date().toISOString().split('T')[0] });
            setActiveTab('my-projects');
        } catch (error: any) {
            console.error("Error submitting proposal:", error);
            alert("Failed to submit proposal: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendNow = async (projectId: string) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'project_requests', projectId), {
                status: 'pending',
                submittedAt: serverTimestamp()
            });
            alert("Draft sent for approval!");
        } catch (error: any) {
            console.error("Error sending draft:", error);
            alert("Failed to send: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkComplete = async (projectId: string) => {
        if (!confirm("Mark this project as complete?")) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'project_requests', projectId), {
                status: 'pending_completion'
            });
            alert("Marked as complete. Waiting for verification.");
        } catch (error: any) {
            console.error("Error marking complete:", error);
            alert("Error: " + error.message);
        } finally {
            setSaving(false);
        }
    };



    // ... existing imports ...

    const generatePDF = () => {
        const doc = new jsPDF();

        // 1. Filter Data (Client-Side for simplicity as 'transactions' has all history)
        const monthName = new Date(0, parseInt(reportMonth)).toLocaleString('default', { month: 'long' });
        const filteredTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear().toString() === reportYear && d.getMonth().toString() === reportMonth;
        });

        // 2. Calculations
        const totalIncome = filteredTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        // Normalize type check for expense as we introduced 'expense' lowercase recently
        const totalExpense = filteredTx.filter(t => t.type === 'EXPENSE' || t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const netBalance = totalIncome - totalExpense;

        // 3. Header
        doc.setFillColor(200, 0, 0); // NCSS Red
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("NCSS Financial Report", 14, 20);

        doc.setFontSize(14);
        doc.text(`Period: ${monthName} ${reportYear}`, 14, 30);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 30);

        // 4. Summary Box
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, 45, 180, 25, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text("Total Income:", 20, 58); // Label
        doc.setTextColor(0, 150, 0); // Green
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(totalIncome)}`, 55, 58); // Value

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text("Total Expenses:", 80, 58); // Label
        doc.setTextColor(200, 0, 0); // Red
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(totalExpense)}`, 120, 58); // Value

        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text("Net Balance:", 150, 58); // Label
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(netBalance)}`, 180, 58); // Value

        // 5. Table
        const tableData = filteredTx.map(t => [
            t.date,
            t.description,
            t.type.toUpperCase(),
            formatCurrency(t.amount)
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Date', 'Description', 'Type', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [200, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { cellWidth: 35, halign: 'right' }
            }
        });

        // 6. Footer
        const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : (doc.internal.pages.length - 1);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generated by NCSS Money Management System', 14, 285);
            doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
        }

        doc.save(`NCSS_Finance_Report_${monthName}_${reportYear}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white text-glow">Funds & Projects</h2>
                    <div className="mt-2 text-2xl font-bold text-gray-400">
                        Current Balance: <span className={totalBalance >= 0 ? "text-green-400" : "text-red-400"}>{formatCurrency(totalBalance)}</span>
                    </div>
                </div>

                <div className="flex bg-white/10 rounded-lg p-1 border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                    <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 text-sm font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Ledger</button>
                    {(isAdmin || isSuperAdmin) && (
                        <>
                            <button onClick={() => setActiveTab('propose')} className={`px-4 py-2 text-sm font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'propose' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>New Proposal</button>
                            <button onClick={() => setActiveTab('my-projects')} className={`px-4 py-2 text-sm font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'my-projects' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>My Projects</button>
                        </>
                    )}
                    <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-bold rounded transition-colors whitespace-nowrap ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Reports</button>
                </div>
            </div>

            {/* --- NEW PROPOSAL TAB --- */}
            {activeTab === 'propose' && (
                <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <div className="p-3 bg-red-600/20 text-red-500 rounded-full"><FileText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">New Project Proposal</h3>
                            <p className="text-sm text-gray-400">Create a draft or submit directly for approval.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="Project Title" className="w-full glass-input p-3 rounded-lg font-bold" value={proposal.title} onChange={e => setProposal({ ...proposal, title: e.target.value })} />
                        <input type="number" placeholder="Estimated Cost (LKR)" className="w-full glass-input p-3 rounded-lg" value={proposal.cost} onChange={e => setProposal({ ...proposal, cost: e.target.value })} />
                        <textarea rows={4} placeholder="Project Description & Allocations..." className="w-full glass-input p-3 rounded-lg" value={proposal.description} onChange={e => setProposal({ ...proposal, description: e.target.value })} />
                        <input type="date" className="w-full glass-input p-3 rounded-lg" value={proposal.date} onChange={e => setProposal({ ...proposal, date: e.target.value })} />

                        <div className="flex gap-4 pt-4">
                            <button onClick={handleSaveDraft} disabled={saving} className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-500/50">
                                <Save className="w-5 h-5" /> 💾 Save as Draft
                            </button>
                            <button onClick={handleSubmitProposal} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:scale-105 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/40">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} 🚀 Submit Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MY PROJECTS TAB --- */}
            {activeTab === 'my-projects' && (
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4 text-white">My Projects</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-xs font-bold text-gray-400 uppercase">
                                <tr>
                                    <th className="p-4">Project</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {myProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">No projects found. Start a new proposal!</td>
                                    </tr>
                                )}
                                {myProjects.map(p => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors text-sm">
                                        <td className="p-4">
                                            <p className="font-bold text-white">{p.title}</p>
                                            <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4 font-bold text-gray-300">{formatCurrency(p.estimatedCost)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                p.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                    p.status === 'pending_completion' ? 'bg-purple-500/20 text-purple-400' :
                                                        p.status === 'draft' ? 'bg-gray-700 text-gray-300' :
                                                            'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {p.status === 'pending' ? 'Waiting for Approval' : p.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-2">
                                            {p.status === 'draft' && (
                                                <button onClick={() => handleSendNow(p.id)} className="mt-3 w-full bg-yellow-600/20 text-yellow-500 border border-yellow-500/50 py-2 rounded-lg hover:bg-yellow-600 hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2">
                                                    🚀 Submit for Approval
                                                </button>
                                            )}
                                            {p.status === 'active' && (
                                                <button onClick={() => handleMarkComplete(p.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500 transition-colors flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Complete
                                                </button>
                                            )}
                                            {p.status === 'completed' && <span className="text-green-500"><CheckCircle className="w-5 h-5" /> Verified</span>}
                                            {p.status === 'pending' && <span className="text-orange-400 text-xs italic">Processing...</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TRANSACTIONS TAB --- */}
            {activeTab === 'transactions' && (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* (Transaction Logic Same as Before - Abbreviated for brevity) */}
                    {isSuperAdmin && (
                        <div className="glass-panel p-6 rounded-2xl h-fit">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Plus className="w-5 h-5" /> Add Direct Transaction</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setTxForm({ ...txForm, type: 'INCOME' })} className={`py-2 text-sm font-bold rounded border ${txForm.type === 'INCOME' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500 hover:text-white'}`}>Income</button>
                                    <button onClick={() => setTxForm({ ...txForm, type: 'EXPENSE' })} className={`py-2 text-sm font-bold rounded border ${txForm.type === 'EXPENSE' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/10 text-gray-500 hover:text-white'}`}>Expense</button>
                                </div>
                                <input type="number" placeholder="Amount" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} className="w-full glass-input p-3 rounded-lg" />
                                <input type="text" placeholder="Description" value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} className="w-full glass-input p-3 rounded-lg" />
                                <button onClick={handleAddTransaction} disabled={saving} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200">{saving ? 'Saving...' : 'Save Record'}</button>
                            </div>
                        </div>
                    )}
                    <div className={`${isSuperAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} glass-panel p-6 rounded-2xl`}>
                        <h3 className="text-lg font-bold mb-4 text-white">Financial Ledger</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-xs font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4 text-right">Amount</th>
                                        {isSuperAdmin && <th className="p-4"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors text-sm">
                                            <td className="p-4 text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-bold text-white">{tx.description}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${tx.type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type}</span></td>
                                            <td className={`p-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)}</td>
                                            {isSuperAdmin && <td className="p-4"><button onClick={() => handleDeleteTransaction(tx.id)}><Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" /></button></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'reports' && (
                <div className="max-w-xl mx-auto glass-panel p-8 rounded-2xl text-center">
                    <h3 className="text-2xl font-black mb-4 text-white">Reports</h3>
                    <div className="flex gap-4 mb-6">
                        <select value={reportYear} onChange={e => setReportYear(e.target.value)} className="flex-1 glass-input p-3 rounded-lg">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                        <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="flex-1 glass-input p-3 rounded-lg">{Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}</select>
                    </div>
                    <button onClick={generatePDF} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20">
                        <Download /> Download PDF
                    </button>
                </div>
            )}
        </div>
    );
};

export default FundsManagement;