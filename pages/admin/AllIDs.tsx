import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { IDCard } from '../../types';
import { Loader, Search, Trash2, User, Phone, Briefcase, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';

const AllIDs = () => {
    const [cards, setCards] = useState<IDCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCards = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'idCards'));
            const fetchedCards: IDCard[] = [];
            querySnapshot.forEach((doc) => {
                fetchedCards.push(doc.data() as IDCard);
            });
            setCards(fetchedCards);
        } catch (error) {
            console.error("Error fetching cards:", error);
            alert("Failed to fetch ID cards. Ensure you have Admin permissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const handleDelete = async (uid: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this member's ID card?")) return;

        try {
            await deleteDoc(doc(db, 'idCards', uid));
            setCards(prev => prev.filter(card => card.uid !== uid));
        } catch (error) {
            console.error(error);
            alert("Failed to delete card.");
        }
    };

    const filteredCards = cards.filter(card =>
        card.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Member Directory</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all registered digital IDs</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Name or ID..."
                            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D90429] focus:border-transparent shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={fetchCards}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg md:hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="h-8 w-8 text-[#D90429] animate-spin" />
                </div>
            ) : filteredCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
                    <div className="bg-orange-50 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Members Found</h3>
                    <p className="text-gray-500 text-sm">No ID cards match your search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCards.map((card) => (
                        <div key={card.uid} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden group">

                            {/* Card Top Border Accent */}
                            <div className="h-1 bg-[#D90429]" />

                            <div className="p-5 flex-1">
                                {/* Profile Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                                            {card.profileImage ? (
                                                <img src={card.profileImage} alt={card.fullName} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-6 w-6 text-gray-400 m-auto mt-2" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 line-clamp-1" title={card.fullName}>
                                                {card.fullName}
                                            </h3>
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                {card.memberId}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details List */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center text-xs text-gray-600 gap-2.5">
                                        <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="font-medium text-gray-700">{card.position}</span>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-600 gap-2.5">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{card.phone}</span>
                                    </div>

                                    {card.batch && (
                                        <div className="flex items-center text-xs text-gray-600 gap-2.5">
                                            <ShieldAlert className="h-3.5 w-3.5 text-gray-400" />
                                            <span>Batch: {card.batch}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-mono">
                                    {new Date(card.generatedAt).toLocaleDateString()}
                                </span>

                                <button
                                    onClick={() => handleDelete(card.uid)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                    title="Delete ID"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllIDs;
