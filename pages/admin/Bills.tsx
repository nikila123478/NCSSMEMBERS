import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import Sidebar from '../../components/Sidebar';
import { db } from '../../utils/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { Folder, Plus, ArrowLeft, FileText, ExternalLink, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../types';

interface FolderData {
    id: string;
    name: string;
    createdAt: any;
}

interface BillData {
    id: string;
    folderId: string;
    imageUrl: string;
    description: string;
    amount: number;
    date: string;
}

const Bills: React.FC = () => {
    const { currentUser } = useStore();
    const navigate = useNavigate();
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [bills, setBills] = useState<BillData[]>([]);
    const [activeFolder, setActiveFolder] = useState<FolderData | null>(null);
    const [loading, setLoading] = useState(true);

    // Forms
    const [newFolderName, setNewFolderName] = useState('');
    const [showFolderInput, setShowFolderInput] = useState(false);

    const [billForm, setBillForm] = useState({ imageUrl: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    const [showBillInput, setShowBillInput] = useState(false);

    // Edit State
    const [editingBill, setEditingBill] = useState<BillData | null>(null);
    const [editForm, setEditForm] = useState({ imageUrl: '', description: '', amount: '', date: '' });

    // Redirect if not Super Admin
    useEffect(() => {
        if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
            navigate(RoutePath.DASHBOARD);
        }
    }, [currentUser, navigate]);

    // Fetch Folders
    useEffect(() => {
        const q = query(collection(db, 'bill_folders'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (sn) => {
            setFolders(sn.docs.map(d => ({ id: d.id, ...d.data() } as FolderData)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch Bills (When folder selected)
    useEffect(() => {
        if (!activeFolder) {
            setBills([]);
            return;
        }
        const q = query(collection(db, 'bills'), where('folderId', '==', activeFolder.id), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (sn) => {
            setBills(sn.docs.map(d => ({ id: d.id, ...d.data() } as BillData)));
        });
        return () => unsub();
    }, [activeFolder]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await addDoc(collection(db, 'bill_folders'), {
            name: newFolderName,
            createdAt: serverTimestamp()
        });
        setNewFolderName('');
        setShowFolderInput(false);
    };

    const handleSaveBill = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeFolder) {
            alert("Please select a folder first!");
            return;
        }
        if (!billForm.imageUrl || !billForm.amount) {
            alert("Please enter an Image URL and Amount.");
            return;
        }

        try {
            console.log("Saving bill to folder:", activeFolder.id);

            await addDoc(collection(db, "bills"), {
                folderId: activeFolder.id,
                imageUrl: billForm.imageUrl,
                description: billForm.description || "No Description",
                amount: Number(billForm.amount),
                date: billForm.date || new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            alert("✅ Bill Saved Successfully!");

            setBillForm({ imageUrl: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
            setShowBillInput(false);
            // Refresh logic is handled by onSnapshot automatically

        } catch (error: any) {
            console.error("Save Error:", error);
            alert("❌ Error saving bill: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this bill permanently?")) {
            try {
                await deleteDoc(doc(db, "bills", id));
                alert("Bill deleted!");
            } catch (error: any) {
                console.error("Error deleting:", error);
                alert("Error deleting bill: " + error.message);
            }
        }
    };

    const handleEditClick = (bill: BillData) => {
        setEditingBill(bill);
        setEditForm({
            imageUrl: bill.imageUrl,
            description: bill.description,
            amount: bill.amount.toString(),
            date: bill.date
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBill) return;

        try {
            await updateDoc(doc(db, "bills", editingBill.id), {
                imageUrl: editForm.imageUrl,
                description: editForm.description,
                amount: Number(editForm.amount),
                date: editForm.date
            });
            alert("✅ Bill Updated Successfully!");
            setEditingBill(null);
        } catch (error: any) {
            console.error("Update Error:", error);
            alert("❌ Error updating bill: " + error.message);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-black text-white pt-24 md:pt-4 flex relative overflow-x-hidden font-outfit">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-black pointer-events-none" />

            <Sidebar activeTab="bills" setActiveTab={() => { }} role={currentUser.role} />

            <main className="relative z-10 flex-1 md:ml-[20rem] p-6 lg:p-10 animate-fade-in pb-24 min-h-screen">

                <div className="flex items-center gap-4 mb-8">
                    {activeFolder && (
                        <button onClick={() => setActiveFolder(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-black text-white text-glow">
                            {activeFolder ? activeFolder.name : "Bills & Vouchers"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {activeFolder ? "Manage bills in this folder" : "Organize financial documents"}
                        </p>
                    </div>
                </div>

                {/* --- FOLDER VIEW --- */}
                {!activeFolder && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {/* Create New Folder Button */}
                            <button
                                onClick={() => setShowFolderInput(true)}
                                className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group"
                            >
                                <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
                                <span className="font-bold text-sm">New Folder</span>
                            </button>

                            {/* Render Folders */}
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setActiveFolder(folder)}
                                    className="aspect-square rounded-2xl bg-gray-900/50 border border-white/10 p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:scale-[1.02] transition-all group shadow-lg"
                                >
                                    <Folder className="w-12 h-12 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
                                    <span className="font-bold text-sm text-center truncate w-full">{folder.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Folder Creation Modal/Input */}
                        {showFolderInput && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                                    <h3 className="font-bold text-xl mb-4">Create New Folder</h3>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Folder Name (e.g., Sportsmeet 2024)"
                                        className="w-full glass-input p-3 rounded-xl mb-4 bg-black/50"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowFolderInput(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10">Cancel</button>
                                        <button onClick={handleCreateFolder} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500">Create</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* --- BILLS VIEW --- */}
                {activeFolder && (
                    <>
                        {/* Add Bill Button */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowBillInput(true)}
                                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-5 h-5" /> Add Bill / Voucher
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {bills.map(bill => (
                                <div key={bill.id} className="group relative bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform">
                                    {/* Image Preview */}
                                    <div className="aspect-video bg-black/50 relative overflow-hidden">
                                        <img src={bill.imageUrl} alt="Bill" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <a
                                            href={bill.imageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        {/* Action Buttons */}
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(bill)}
                                                className="p-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bill.id)}
                                                className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white line-clamp-1">{bill.description}</h4>
                                            <span className="font-black text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs">LKR {bill.amount}</span>
                                        </div>
                                        <p className="text-gray-500 text-xs">{bill.date}</p>
                                    </div>
                                </div>
                            ))}

                            {bills.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 italic border-2 border-dashed border-white/5 rounded-2xl">
                                    No bills in this folder yet.
                                </div>
                            )}
                        </div>

                        {/* Add Bill Modal */}
                        {showBillInput && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                                <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
                                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-red-500" /> Add New Bill</h3>

                                    <form onSubmit={handleSaveBill}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Image URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                    value={billForm.imageUrl}
                                                    onChange={e => setBillForm({ ...billForm, imageUrl: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Description</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Refreshments for Guest"
                                                    className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                    value={billForm.description}
                                                    onChange={e => setBillForm({ ...billForm, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-400 font-bold uppercase ml-1">Amount (LKR)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                        value={billForm.amount}
                                                        onChange={e => setBillForm({ ...billForm, amount: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 font-bold uppercase ml-1">Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                        value={billForm.date}
                                                        onChange={e => setBillForm({ ...billForm, date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6">
                                            <button type="button" onClick={() => setShowBillInput(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold">Cancel</button>
                                            <button type="submit" className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-600/20">Save Bill</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Edit Bill Modal */}
                {editingBill && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Pencil className="w-5 h-5 text-blue-500" /> Edit Bill</h3>

                            <form onSubmit={handleUpdate}>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold uppercase ml-1">Image URL</label>
                                        <input
                                            type="text"
                                            className="w-full glass-input p-3 rounded-xl bg-black/50"
                                            value={editForm.imageUrl}
                                            onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold uppercase ml-1">Description</label>
                                        <input
                                            type="text"
                                            className="w-full glass-input p-3 rounded-xl bg-black/50"
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase ml-1">Amount (LKR)</label>
                                            <input
                                                type="number"
                                                className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                value={editForm.amount}
                                                onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase ml-1">Date</label>
                                            <input
                                                type="date"
                                                className="w-full glass-input p-3 rounded-xl bg-black/50"
                                                value={editForm.date}
                                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button type="button" onClick={() => setEditingBill(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20">Update Bill</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default Bills;
