import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase';

const AdminMessaging = () => {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState("");
    const [selectedRecipient, setSelectedRecipient] = useState("ALL");

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                setLoading(true);
                console.log("--- STARTING ADMIN SEARCH ---");

                // 1. Get ALL users (No filtering query to avoid index/case issues)
                const querySnapshot = await getDocs(collection(db, "users"));

                const adminList: any[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Debug Log: Print every user found to the console
                    console.log(`Checking User: ${data.name} | Role in DB: '${data.role}'`);

                    // 2. Safe Filter: Convert to lowercase and check
                    // Checks for: "admin", "Admin", "ADMIN", "super_admin", "Super_Admin"
                    const role = data.role ? data.role.toLowerCase().trim() : "user";

                    if (role === 'admin' || role === 'super_admin') {
                        adminList.push({ id: doc.id, ...data });
                        console.log(">>> MATCH FOUND! Added to list.");
                    }
                });

                console.log("Total Admins Found:", adminList.length);
                setAdmins(adminList);
            } catch (error) {
                console.error("Error fetching admins:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, []);

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        try {
            const recipients = selectedRecipient === "ALL"
                ? admins
                : admins.filter(a => a.id === selectedRecipient);

            if (recipients.length === 0) {
                alert("No recipients found!");
                return;
            }

            // Send to each recipient
            for (const recipient of recipients) {
                await addDoc(collection(db, "messages"), {
                    text: messageText,
                    sender: "Admin System",
                    receiverId: recipient.id,
                    receiverName: recipient.name || "Unknown Admin",
                    timestamp: serverTimestamp(),
                    read: false,
                    type: "admin_broadcast"
                });
            }

            alert(`Message Sent Successfully to ${recipients.length} admins! 🚀`);
            setMessageText("");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        }
    };

    return (
        <div className="p-6 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-red-500 drop-shadow-md">Admin Communication Hub</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT: COMPOSE */}
                <div className="bg-black/60 backdrop-blur-xl border border-red-500/30 p-6 rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                    <h2 className="text-xl font-bold mb-4">Compose Message</h2>

                    <label className="block text-gray-400 mb-2 text-sm">Send To:</label>
                    <select
                        className="w-full bg-black/50 border border-red-500/30 rounded-xl p-3 text-white mb-4 focus:ring-red-500 outline-none"
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value)}
                    >
                        <option value="ALL">📢 All Admins (Broadcast)</option>
                        {admins.map(admin => (
                            <option key={admin.id} value={admin.id}>👤 {admin.name || "Unnamed Admin"}</option>
                        ))}
                    </select>

                    <textarea
                        className="w-full h-40 bg-black/50 border border-red-500/30 rounded-xl p-4 text-white placeholder-gray-500 focus:border-red-500 outline-none"
                        placeholder="Type your update here..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    />

                    <button onClick={handleSendMessage} className="mt-4 w-full bg-gradient-to-r from-red-700 to-red-900 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-red-900/40">
                        🚀 Send Message
                    </button>
                </div>

                {/* RIGHT: LIST */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Active Team ({admins.length})</h2>

                    {loading ? (
                        <p className="text-gray-400 animate-pulse">Scanning Database...</p>
                    ) : admins.length === 0 ? (
                        <div className="p-6 border border-red-500/50 rounded-xl bg-red-900/20 text-center">
                            <p className="text-xl mb-2">⚠️ No Admins Found.</p>
                            <p className="text-sm text-gray-300">
                                Open your Browser Console (F12) to see all users and their roles.
                                <br />
                                Make sure you have users with role: <b>'admin'</b> or <b>'Admin'</b>.
                            </p>
                        </div>
                    ) : (
                        admins.map((admin) => (
                            <div key={admin.id} className="flex items-center gap-4 p-4 bg-white/5 border border-red-500/20 rounded-2xl hover:bg-white/10 transition">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-lg shadow-md">
                                    {admin.name?.charAt(0).toUpperCase() || "A"}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{admin.name || "Unknown User"}</p>
                                    <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded border border-red-500/30">
                                        {admin.role?.toUpperCase()}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">{admin.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminMessaging;
