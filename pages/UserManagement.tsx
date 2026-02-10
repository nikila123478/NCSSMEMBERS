import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, Shield, User as UserIcon, Plus, X, Loader2, Key, Folder, ArrowLeft, Download, CheckCircle, XCircle, Star } from 'lucide-react';
import { Role, FirestoreUser, PointHistoryItem } from '../types';
import { db } from '../utils/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, orderBy, updateDoc, getDocs, arrayUnion, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GRADES = [
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
    'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13',
    'Other / Non-School Member'
];

const getRoleIcon = (role: Role) => {
    switch (role) {
        case 'SUPER_ADMIN':
        case 'super_admin': return <Shield className="w-4 h-4 text-red-500" />;
        case 'MEMBER_ADMIN':
        case 'admin': return <Shield className="w-4 h-4 text-orange-500" />;
        default: return <UserIcon className="w-4 h-4 text-gray-400" />;
    }
};

const UserManagement: React.FC = () => {
    const { currentUser } = useStore();
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [newAccessCode, setNewAccessCode] = useState('');
    const [newTransparencyCode, setNewTransparencyCode] = useState('');
    const [newMemberCode, setNewMemberCode] = useState('');

    // Points Modal State
    const [showPointsModal, setShowPointsModal] = useState(false);
    const [pointsAmount, setPointsAmount] = useState('');
    const [pointsReason, setPointsReason] = useState('');

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'USER' as Role,
        password: 'member123',
        designation: 'Member',
        grade: 'Grade 6',
        phoneNumber: ''
    });

    // Fetch Users Real-time
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc')); // Optional ordering
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const usersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as FirestoreUser[];
                setUsers(usersList);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const toggleApproval = async (user: FirestoreUser) => {
        if (!currentUser) return;
        try {
            const newStatus = !user.isApproved;
            await updateDoc(doc(db, 'users', user.id), {
                isApproved: newStatus
            });
            // Optimistic update
            // Optimistic update removed - relying on onSnapshot
            alert(`User ${newStatus ? 'Approved' : 'Unapproved'} Successfully`);
        } catch (error) {
            console.error("Error toggling approval:", error);
            alert("Failed to update status");
        }
    };

    // Group Users by Grade
    const usersByGrade = useMemo(() => {
        const groups: Record<string, FirestoreUser[]> = {};
        GRADES.forEach(g => groups[g] = []);

        users.forEach(user => {
            const userGrade = user.grade || 'Other / Non-School Member';
            if (groups[userGrade]) {
                groups[userGrade].push(user);
            } else {
                if (!groups['Other / Non-School Member']) groups['Other / Non-School Member'] = [];
                groups['Other / Non-School Member'].push(user);
            }
        });
        return groups;
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (!selectedGrade) return [];
        return usersByGrade[selectedGrade] || [];
    }, [selectedGrade, usersByGrade]);

    // PDF Generation
    const generatePDF = () => {
        if (!selectedGrade) return;

        const doc = new jsPDF();
        const users = filteredUsers;
        const dateStr = new Date().toLocaleDateString();

        // 1. Logo & Header
        // Note: For a real app, ensure this image is loaded or base64 encoded to avoid CORS issues if possible. 
        // Here we rely on the URL being accessible or standard text fallback.
        const logoUrl = "https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png";

        // Add Image (We'll try standard addImage, might fail if CORS blocks. 
        // Best practice is to import local image or Fetch Blob. For simplicity, we assume browser handles it or we use text if fails.)
        try {
            doc.addImage(logoUrl, 'PNG', 105 - 15, 10, 30, 30); // Centered approx
        } catch (e) {
            console.error("Image load failed", e);
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("NALANDA COLLEGE SCIENCE SOCIETY", 105, 50, { align: "center" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text(`Member List - ${selectedGrade}`, 105, 58, { align: "center" });

        doc.setFontSize(10);
        doc.text(`Generated: ${dateStr}`, 200, 10, { align: "right" });

        // 2. Table
        const tableColumn = ["Display Name", "Email", "Phone", "Designation", "Join Date"];
        const tableRows: any[] = [];

        users.forEach(user => {
            const userData = [
                user.displayName || user.name || "N/A",
                user.email,
                user.phoneNumber || "N/A",
                user.designation || "Member",
                user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : "N/A"
            ];
            tableRows.push(userData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] }, // Red Header
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // 3. Footer
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Generated by NCSS Official Website System", 105, pageHeight - 10, { align: "center" });

        doc.save(`NCSS_Members_${selectedGrade.replace(/ /g, '_')}.pdf`);
    };


    const handleCreateUser = async () => {
        // Allowlist Logic: Only need Email and Name. Password will be set by user on signup.
        if (!newUser.name || !newUser.email) {
            alert("Please fill in Name and Email.");
            return;
        }

        setLoading(true);

        try {
            // Create Allowlist Entry using Email as ID
            await setDoc(doc(db, "users", newUser.email), {
                uid: newUser.email, // Temporary ID until they sign up
                email: newUser.email,
                displayName: newUser.name,
                name: newUser.name,
                role: newUser.role,
                designation: newUser.designation,
                grade: newUser.grade,
                phoneNumber: newUser.phoneNumber,
                createdAt: serverTimestamp(),
                approved: true // Mark as pre-approved admin
            });

            alert(`Admin added! Tell them to Sign Up with ${newUser.email}`);

            // Reset Form
            setNewUser({
                name: '', email: '', password: 'member123', role: 'USER', designation: '',
                grade: 'Grade 6', phoneNumber: ''
            });
            setShowModal(false);

        } catch (error: any) {
            console.error("Error adding user to allowlist:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try { await deleteDoc(doc(db, 'users', id)); } catch (e) { }
        }
    };

    const handleRoleUpdate = async (id: string, newRole: Role) => {
        try { await setDoc(doc(db, 'users', id), { role: newRole }, { merge: true }); } catch (e) { }
    };

    const openCodeModal = (user: FirestoreUser) => {
        setSelectedUser(user);
        setNewAccessCode(user.accessCode || '');
        setNewTransparencyCode(user.transparencyCode || '');
        setNewMemberCode(user.memberAccessCode || '');
        setShowCodeModal(true);
    };

    const openPointsModal = (user: FirestoreUser) => {
        setSelectedUser(user);
        setPointsAmount('');
        setPointsReason('Contribution to NCSS');
        setShowPointsModal(true);
    };

    const handleAddPoints = async () => {
        if (!selectedUser || !pointsAmount) return;
        const amount = parseInt(pointsAmount);
        if (isNaN(amount)) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', selectedUser.id);
            const newHistoryItem: PointHistoryItem = {
                date: new Date().toISOString(),
                score: amount,
                reason: pointsReason || 'Admin Update'
            };

            await updateDoc(userRef, {
                points: increment(amount),
                pointsHistory: arrayUnion(newHistoryItem)
            });

            alert(`Added ${amount} points to ${selectedUser.displayName}`);
            setShowPointsModal(false);
            // Refresh logic handled by real-time listener

        } catch (error) {
            console.error("Error adding points:", error);
            alert("Failed to update points.");
        } finally {
            setLoading(false);
        }
    };

    // Master PDF Generation
    const generateMasterPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        const logoUrl = "https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png";

        try {
            doc.addImage(logoUrl, 'PNG', 105 - 15, 10, 30, 30);
        } catch (e) { console.error(e); }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("NALANDA COLLEGE SCIENCE SOCIETY", 105, 50, { align: "center" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("NCSS - Complete Member Registry (All Grades)", 105, 58, { align: "center" });

        doc.setFontSize(10);
        doc.text(`Generated: ${dateStr}`, 200, 10, { align: "right" });

        // Sort all users by Grade then Name
        const sortedUsers = [...users].sort((a, b) => { // Changed allUsers to users
            const gradeA = a.grade || "Z"; // Push empty grades to bottom
            const gradeB = b.grade || "Z";
            if (gradeA < gradeB) return -1;
            if (gradeA > gradeB) return 1;
            return (a.displayName || "").localeCompare(b.displayName || "");
        });

        const tableColumn = ["Grade", "Display Name", "Email", "Phone", "Designation"];
        const tableRows: any[] = [];

        sortedUsers.forEach(user => {
            const userData = [
                user.grade || "Other",
                user.displayName || user.name || "N/A",
                user.email,
                user.phoneNumber || "N/A",
                user.designation || "Member"
            ];
            tableRows.push(userData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }, // Black Header for Master
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });

        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Generated by NCSS Official Website System", 105, pageHeight - 10, { align: "center" });

        doc.save(`NCSS_Master_Registry_${dateStr.replace(/\//g, '-')}.pdf`);
    };

    return (
        <div className="space-y-8 animate-fade-in text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white text-glow">
                        {selectedGrade ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedGrade(null)} className="hover:text-red-400 transition-colors">
                                    <ArrowLeft className="w-8 h-8" />
                                </button>
                                {selectedGrade}
                            </div>
                        ) : 'Members Manager'}
                    </h2>
                    <p className="text-gray-400">
                        {selectedGrade ? `${filteredUsers.length} Registered Members` : 'Select a Grade Folder to manage members'}
                    </p>
                </div>
                <div className="flex gap-4">
                    {selectedGrade ? (
                        <button
                            onClick={generatePDF}
                            className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg shadow-lg hover:bg-white/20 flex items-center gap-2 transition-all"
                        >
                            <Download className="w-5 h-5" /> Download Report
                        </button>
                    ) : (
                        <button
                            onClick={generateMasterPDF}
                            className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg shadow-lg hover:bg-white/20 flex items-center gap-2 transition-all"
                        >
                            <Download className="w-5 h-5" /> Master Registry (PDF)
                        </button>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Add New User
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedGrade ? (
                    /* --- FOLDER GRID VIEW --- */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {GRADES.map((grade) => {
                            const count = usersByGrade[grade]?.length || 0;
                            return (
                                <button
                                    key={grade}
                                    onClick={() => setSelectedGrade(grade)}
                                    className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all text-left"
                                >
                                    <div className="absolute top-4 right-4 text-4xl text-white/5 group-hover:text-red-500/10 transition-colors">
                                        <Folder className="w-16 h-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{grade}</h3>
                                        <p className="text-gray-400 text-sm mt-1">{count} Members</p>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                ) : (
                    /* --- USER TABLE VIEW --- */
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel rounded-2xl overflow-hidden"
                    >
                        {filteredUsers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No members found in {selectedGrade}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-xs font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Designation</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 text-sm transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white uppercase">
                                                        {(u.displayName || u.name || '?')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{u.displayName || u.name}</p>
                                                        <p className="text-xs text-gray-400">Since: {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-white">{u.email}</p>
                                                <p className="text-xs text-gray-400">{u.phoneNumber || "No Phone"}</p>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={u.role}
                                                    onChange={async (e) => {
                                                        const newRole = e.target.value as Role;
                                                        if (window.confirm(`Are you sure you want to change ${u.displayName}'s role to ${newRole}?`)) {
                                                            try {
                                                                await updateDoc(doc(db, "users", u.id), { role: newRole });
                                                                // Optimistic update of local state if needed, or let real-time listener handle it
                                                                alert(`Role updated to ${newRole}`);
                                                            } catch (err) {
                                                                console.error("Error updating role:", err);
                                                                alert("Failed to update role");
                                                            }
                                                        }
                                                    }}
                                                    className={`text-[10px] font-black px-2 py-1 rounded uppercase bg-transparent border border-white/10 outline-none cursor-pointer ${['SUPER_ADMIN', 'super_admin'].includes(u.role) ? 'text-white' :
                                                        ['MEMBER_ADMIN', 'admin'].includes(u.role) ? 'text-red-500' :
                                                            'text-gray-400'
                                                        }`}
                                                >
                                                    <option value="member" className="bg-black text-gray-400">Member</option>
                                                    <option value="admin" className="bg-black text-red-500">Admin</option>
                                                    <option value="super_admin" className="bg-black text-white">Super Admin</option>

                                                    {/* Legacy Options (Hidden from selection but kept for display match if current) */}
                                                    <option value="USER" className="hidden">Member (Legacy)</option>
                                                    <option value="MEMBER_ADMIN" className="hidden">Admin (Legacy)</option>
                                                    <option value="SUPER_ADMIN" className="hidden">Super Admin (Legacy)</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-gray-400">
                                                {u.designation || 'Member'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleApproval(u)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${u.isApproved ? 'bg-green-600' : 'bg-gray-700'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.isApproved ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                    <div className="text-xs">
                                                        <span className={u.isApproved ? "text-green-400 font-bold" : "text-gray-500"}>
                                                            {u.isApproved ? 'Active' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => openPointsModal(u)} className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded" title="Manage Points"><Star className="w-4 h-4" /></button>
                                                <button onClick={() => openCodeModal(u)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded" title="Set Codes"><Key className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE USER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-scale-in border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">Create Account</h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                    <input type="text" className="w-full glass-input p-3 rounded-lg font-bold" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Grade</label>
                                    <select className="w-full glass-input p-3 rounded-lg font-bold" value={newUser.grade} onChange={e => setNewUser({ ...newUser, grade: e.target.value })}>
                                        {GRADES.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label>
                                    <input type="text" className="w-full glass-input p-3 rounded-lg" value={newUser.phoneNumber} onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                                    <select className="w-full glass-input p-3 rounded-lg font-bold" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}>
                                        <option value="USER" className="text-black">Member</option>
                                        <option value="MEMBER_ADMIN" className="text-black">Admin</option>
                                        <option value="SUPER_ADMIN" className="text-black">Super Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email (Login ID)</label>
                                <input type="email" className="w-full glass-input p-3 rounded-lg" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Designation</label>
                                <input type="text" className="w-full glass-input p-3 rounded-lg" placeholder="e.g. Treasurer" value={newUser.designation} onChange={e => setNewUser({ ...newUser, designation: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                                <input type="text" className="w-full glass-input p-3 rounded-lg" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>

                            <button onClick={handleCreateUser} disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-4">
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* SET CODE MODAL REUSED (Simplified for brevity as no logic changed, just layout) */}
            {/* ... (Existing Code Modal Logic kept same but cleaner) ... */}
            {showCodeModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Set Access Code</h3>
                                <p className="text-sm text-gray-400">For {selectedUser.displayName}</p>
                            </div>
                            <button onClick={() => setShowCodeModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ID Access Code</label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full glass-input p-3 rounded-lg font-mono text-center text-lg tracking-widest text-[#D90429] border-[#D90429]/30"
                                    placeholder="e.g. NCSS-ID-550"
                                    value={newAccessCode}
                                    onChange={e => setNewAccessCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Member Dashboard Code</label>
                                <input
                                    type="text"
                                    className="w-full glass-input p-3 rounded-lg font-mono text-center text-lg tracking-widest text-white border-white/30"
                                    placeholder="e.g. 1234"
                                    value={newMemberCode}
                                    onChange={e => setNewMemberCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Transparency Access Code</label>
                                <input
                                    type="text"
                                    className="w-full glass-input p-3 rounded-lg font-mono text-center text-lg tracking-widest text-blue-400 border-blue-500/30"
                                    placeholder="e.g. NCSS-TR-2025"
                                    value={newTransparencyCode}
                                    onChange={e => setNewTransparencyCode(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!selectedUser) return;
                                    updateDoc(doc(db, 'users', selectedUser.id), {
                                        accessCode: newAccessCode,
                                        transparencyCode: newTransparencyCode,
                                        memberAccessCode: newMemberCode
                                    }).then(() => {
                                        alert("Codes updated!");
                                        setShowCodeModal(false);
                                    });
                                }}
                                className="w-full py-3 bg-[#D90429] text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg"
                            >
                                Save Codes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POINTS MODAL */}
            {
                showPointsModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="glass-panel bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-scale-in border border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Manage Points</h3>
                                    <p className="text-sm text-gray-400">For {selectedUser.displayName}</p>
                                    <p className="text-xs text-yellow-500 font-bold mt-1">Current: {selectedUser.points || 0}</p>
                                </div>
                                <button onClick={() => setShowPointsModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Points to Add/Remove</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full glass-input p-3 rounded-lg font-mono text-center text-2xl font-bold text-yellow-400 border-yellow-500/30"
                                        placeholder="0"
                                        value={pointsAmount}
                                        onChange={e => setPointsAmount(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Use negative values to deduct points (e.g. -10)</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Reason</label>
                                    <input
                                        type="text"
                                        className="w-full glass-input p-3 rounded-lg"
                                        placeholder="e.g. Science Day Winner"
                                        value={pointsReason}
                                        onChange={e => setPointsReason(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleAddPoints}
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-800 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-current" />}
                                    Update Balance
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserManagement;