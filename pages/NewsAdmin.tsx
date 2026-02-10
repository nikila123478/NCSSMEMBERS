import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Newspaper, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { ContentItem, LinkItem } from '../types';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';

const NewsAdmin: React.FC = () => {
    // Local State
    const [news, setNews] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [saving, setSaving] = useState(false);

    // Fetch News Real-time
    useEffect(() => {
        const q = query(collection(db, 'news'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ContentItem[];
            setNews(newsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddLinkRow = () => {
        const newLink: LinkItem = {
            id: Date.now().toString(),
            label: '',
            url: ''
        };
        setLinks([...links, newLink]);
    };

    const handleLinkChange = (id: string, field: 'label' | 'url', value: string) => {
        setLinks(links.map(link => link.id === id ? { ...link, [field]: value } : link));
    };

    const handleRemoveLink = (id: string) => {
        setLinks(links.filter(link => link.id !== id));
    };

    const handlePostNews = async () => {
        if (!title || !description) {
            alert("Please provide a title and description.");
            return;
        }

        setSaving(true);
        try {
            // Filter links
            const validLinks = links.filter(l => l.label && l.url);

            // Save to Firestore directly
            await addDoc(collection(db, 'news'), {
                title,
                description,
                imageUrl: imageUrl.trim(), // Save the string directly
                downloadLinks: validLinks,
                date: new Date().toISOString(),
                createdAt: serverTimestamp()
            });

            // Success & Reset
            setTitle('');
            setDescription('');
            setImageUrl('');
            setLinks([]);

        } catch (error) {
            console.error("Error saving news:", error);
            alert("Failed to save news. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNews = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this news item?")) {
            try {
                await deleteDoc(doc(db, 'news', id));
            } catch (error) {
                console.error("Error deleting news:", error);
                alert("Failed to delete.");
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div>
                <h2 className="text-3xl font-black text-gray-900">News Management</h2>
                <p className="text-gray-500">Post announcements and updates for the society.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 h-fit">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Newspaper className="w-5 h-5" /></div>
                        <h3 className="font-bold text-lg">Compose Update</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Headline</label>
                        <input
                            type="text"
                            value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold"
                            placeholder="e.g. Annual Stargazing Night"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                        <textarea
                            rows={5}
                            value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            placeholder="Write the details here..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Main Image URL</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                placeholder="Paste image link here (e.g. https://imgur.com/...)"
                            />
                            {imageUrl && (
                                <button onClick={() => setImageUrl('')} className="p-3 text-red-600 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Links Section */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Download Links / Attachments</label>
                            <button onClick={handleAddLinkRow} type="button" className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Link
                            </button>
                        </div>

                        <div className="space-y-3">
                            {links.map((link) => (
                                <div key={link.id} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="Link Name"
                                        className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                                        value={link.label}
                                        onChange={(e) => handleLinkChange(link.id, 'label', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="URL (https://...)"
                                        className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm"
                                        value={link.url}
                                        onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleRemoveLink(link.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {links.length === 0 && <p className="text-xs text-gray-400 italic">No attachments added.</p>}
                        </div>
                    </div>

                    <button
                        onClick={handlePostNews}
                        disabled={saving}
                        className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {saving ? "Posting..." : "Publish News"}
                    </button>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-500 text-sm uppercase">Recent Posts (Live)</h3>
                    {loading && <p className="text-sm text-gray-400">Loading...</p>}

                    {!loading && news.length === 0 && (
                        <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No news items found in Firestore.</p>
                        </div>
                    )}

                    {news.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">{item.title}</h4>
                                    <p className="text-xs text-gray-400 mb-2">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteNews(item.id)}
                                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {item.imageUrl && (
                                <img src={item.imageUrl} alt="preview" className="w-full h-32 object-cover rounded-lg my-3" />
                            )}

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

                            {item.downloadLinks && item.downloadLinks.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {item.downloadLinks.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs font-bold text-gray-600 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <LinkIcon className="w-3 h-3" /> {link.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsAdmin;