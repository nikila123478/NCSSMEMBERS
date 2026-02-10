import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase'; // Adjust path if necessary, standard is ../../utils/firebase
import { Loader2, ArrowUpRight, ArrowDownRight, Calendar, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/format'; // Assuming this exists based on previous files

interface Transaction {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'income' | 'expense';
    description: string;
    date: string | any; // Handling string or Firestore timestamp
    userName?: string;
    userRole?: string;
    // Add other fields if necessary
}

const MonthlyReport: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                // Fetching from 'funds' as that's where transactions seem to be stored in FundsManagement
                const q = query(collection(db, "funds"), orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);

                const txList: Transaction[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Transaction));

                setTransactions(txList);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Summary Calculations (Optional but good for a "Report" page)
    const totalIncome = transactions
        .filter(t => t.type?.toLowerCase() === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
        .filter(t => t.type?.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-red-500"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    }

    return (
        <div className="p-6 min-h-screen text-white font-outfit bg-black">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-red-500 drop-shadow-md flex items-center gap-3">
                    <FileText className="w-8 h-8" /> Monthly Financial Report
                </h1>
                <p className="text-gray-400 mt-2">Detailed breakdown of all income and expenses.</p>
            </motion.div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 p-6 rounded-2xl">
                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Income</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-red-500/30 p-6 rounded-2xl">
                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Net Balance</p>
                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>{formatCurrency(balance)}</p>
                </div>
            </div>

            {/* DETAILED TRANSACTION TABLE */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(220,38,38,0.1)]"
            >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    📜 Detailed Transaction History
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pb-4 text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-red-500/20">Date</th>
                                <th className="pb-4 text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-red-500/20">User / Admin</th>
                                <th className="pb-4 text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-red-500/20">Description</th>
                                <th className="pb-4 text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-red-500/20 text-right">Amount (LKR)</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-8">No transactions found.</td>
                                </tr>
                            ) : (
                                transactions.map((t) => {
                                    // Handle Date parsing safely
                                    let dateStr = "Unknown Date";
                                    if (t.date) {
                                        if (typeof t.date === 'string') {
                                            dateStr = new Date(t.date).toLocaleDateString();
                                        } else if (t.date?.toDate) {
                                            dateStr = t.date.toDate().toLocaleDateString();
                                        }
                                    }

                                    const isExpense = t.type?.toLowerCase() === 'expense';

                                    return (
                                        <tr key={t.id} className="group border-b border-white/5 hover:bg-white/5 transition-all">
                                            <td className="py-4 text-gray-300 text-sm font-mono">
                                                {dateStr}
                                            </td>
                                            <td className="py-4 text-white font-medium flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-xs font-bold border border-red-500/30">
                                                    {t.userName ? t.userName.charAt(0).toUpperCase() : <User className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm">{t.userName || "Unknown User"}</p>
                                                    {t.userRole && <p className="text-[10px] text-gray-500 uppercase">{t.userRole}</p>}
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-300 text-sm">
                                                {t.description}
                                            </td>
                                            <td className={`py-4 text-right font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
                                                <div className="flex items-center justify-end gap-1">
                                                    {isExpense ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    {isExpense ? '-' : '+'} {formatCurrency(t.amount)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default MonthlyReport;
