import React, { useState, useEffect } from 'react';
import { db, storage } from '../utils/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Trash2, Upload, Loader2, Plus, Link as LinkIcon, Folder, ArrowLeft, Image as ImageIcon, Save, Edit2 } from 'lucide-react';
import { GalleryImage, GalleryFolder } from '../types';

const GalleryAdmin: React.FC = () => {
    // --- STATE ---
    const [folders, setFolders] = useState<GalleryFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<GalleryFolder | null>(null);
    const [folderImages, setFolderImages] = useState<GalleryImage[]>([]);

    // Carousel State (Kept as separate section)
    const [carouselUrls, setCarouselUrls] = useState<string[]>([]);
    const [newCarouselUrl, setNewCarouselUrl] = useState('');

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Create Folder State
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Initial Fetch
    useEffect(() => {
        // Fetch Carousel
        const fetchCarousel = async () => {
            const docRef = doc(db, 'settings', 'gallery_carousel');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCarouselUrls(docSnap.data().urls || []);
            }
        };
        fetchCarousel();

        // Fetch Folders
        const qFolders = query(collection(db, 'gallery_folders'), orderBy('createdAt', 'desc'));
        const unsubFolders = onSnapshot(qFolders, (snap) => {
            setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryFolder)));
            setLoading(false);
        });

        return () => unsubFolders();
    }, []);

    // Fetch Images when Folder Selected
    useEffect(() => {
        if (!selectedFolder) return;

        // Simple query: get all 'standard' images (we filter by folder in client for now or could query by parentFolderId if we indexed it)
        // Best practice: Query by parentFolderId.
        // Assuming we update standard images to have parentFolderId
        const qImages = query(collection(db, 'gallery_images'), orderBy('createdAt', 'desc'));
        const unsubImages = onSnapshot(qImages, (snap) => {
            const allImages = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
            // Filter client-side for simplicity without composite index issues for now
            const filtered = allImages.filter(img => img.parentFolderId === selectedFolder.id);
            setFolderImages(filtered);
        });

        return () => unsubImages();
    }, [selectedFolder]);


    // --- ACTIONS: FOLDERS ---
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        await addDoc(collection(db, 'gallery_folders'), {
            name: newFolderName,
            createdAt: Date.now(),
            coverImage: '' // Can be updated later
        });
        setNewFolderName('');
        setIsCreatingFolder(false);
    };

    const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Delete this folder? Images inside won't be deleted but will be orphaned.")) return;
        await deleteDoc(doc(db, 'gallery_folders', id));
    };

    // --- ACTIONS: IMAGES INSIDE FOLDER ---

    // Method A: Paste URLs
    const [pasteUrls, setPasteUrls] = useState('');
    const handlePasteUrls = async () => {
        if (!selectedFolder || !pasteUrls.trim()) return;
        setUploading(true);

        const urls = pasteUrls.split('\n').filter(u => u.trim());

        for (const url of urls) {
            await addDoc(collection(db, 'gallery_images'), {
                url: url.trim(),
                createdAt: Date.now(),
                category: 'standard',
                parentFolderId: selectedFolder.id
            });
        }

        // If folder has no cover, use the first one
        if (!selectedFolder.coverImage && urls.length > 0) {
            await updateDoc(doc(db, 'gallery_folders', selectedFolder.id), { coverImage: urls[0].trim() });
        }

        setPasteUrls('');
        setUploading(false);
    };

    // Method B: Upload Files (Custom Drag & Drop)
    const handleFileUpload = async (files: FileList | null) => {
        if (!selectedFolder || !files || files.length === 0) return;
        setUploading(true);

        try {
            const fileArray = Array.from(files);
            let firstUrl = '';

            await Promise.all(fileArray.map(async (file) => {
                const storageRef = ref(storage, `gallery/${selectedFolder.id}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                if (!firstUrl) firstUrl = url;

                await addDoc(collection(db, 'gallery_images'), {
                    url,
                    createdAt: Date.now(),
                    category: 'standard',
                    parentFolderId: selectedFolder.id,
                    caption: file.name
                });
            }));

            // Set cover image if none exists
            if (!selectedFolder.coverImage && firstUrl) {
                await updateDoc(doc(db, 'gallery_folders', selectedFolder.id), { coverImage: firstUrl });
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };


    // --- CAROUSEL ACTIONS ---
    const handleAddCarouselUrl = async () => {
        if (!newCarouselUrl.trim()) return;
        const updated = [...carouselUrls, newCarouselUrl.trim()];
        setCarouselUrls(updated);
        setNewCarouselUrl('');
        await setDoc(doc(db, 'settings', 'gallery_carousel'), { urls: updated });
    };

    const handleDeleteCarouselUrl = async (idx: number) => {
        const updated = carouselUrls.filter((_, i) => i !== idx);
        setCarouselUrls(updated);
        await setDoc(doc(db, 'settings', 'gallery_carousel'), { urls: updated });
    };


    return (
        <div className="space-y-12 animate-fade-in pb-24">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">Gallery Ecosystem</h2>
                    <p className="text-gray-400">Manage 3D Carousel & Folders</p>
                </div>
            </div>

            {/* --- SECTION A: 3D CAROUSEL --- */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" /> Part 1: 3D Carousel (Global)
                </h3>
                <div className="flex gap-4 mb-4">
                    <input
                        value={newCarouselUrl} onChange={e => setNewCarouselUrl(e.target.value)}
                        placeholder="Paste Image URL..."
                        className="flex-1 bg-black/40 border border-red-500/30 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
                    />
                    <button onClick={handleAddCarouselUrl} className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {carouselUrls.map((url, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                            <img src={url} className="w-full h-full object-cover" />
                            <button onClick={() => handleDeleteCarouselUrl(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SECTION B: FOLDER MANAGER --- */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-3xl p-8 min-h-[500px]">

                {/* LEVEL 1: FOLDER LIST */}
                {!selectedFolder ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                                <Folder className="w-5 h-5" /> Part 2: Folder Manager
                            </h3>
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" /> New Folder
                            </button>
                        </div>

                        {isCreatingFolder && (
                            <div className="bg-black/40 p-4 rounded-xl mb-6 flex gap-4 border border-blue-500/30 animate-fade-in">
                                <input
                                    value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Folder Name (e.g., Science Day 2025)"
                                    className="flex-1 bg-transparent border-b border-blue-500 text-white px-2 py-1 outline-none"
                                    autoFocus
                                />
                                <button onClick={handleCreateFolder} className="text-green-400 font-bold hover:text-green-300">Save</button>
                                <button onClick={() => setIsCreatingFolder(false)} className="text-gray-400 hover:text-white">Cancel</button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder)}
                                    className="group cursor-pointer bg-black/40 hover:bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-2xl p-4 transition-all hover:-translate-y-1"
                                >
                                    <div className="aspect-square bg-gray-900 rounded-xl mb-3 overflow-hidden relative">
                                        {folder.coverImage ? (
                                            <img src={folder.coverImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                <Folder className="w-12 h-12" />
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                                            className="absolute top-2 right-2 p-2 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-white text-center truncate">{folder.name}</h4>
                                    <p className="text-gray-500 text-xs text-center">{new Date(folder.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* LEVEL 2: INSIDE FOLDER */
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSelectedFolder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ArrowLeft className="w-6 h-6 text-white" />
                            </button>
                            <div>
                                <h3 className="text-2xl font-black text-white">{selectedFolder.name}</h3>
                                <p className="text-gray-400 text-sm">Managing Images</p>
                            </div>
                        </div>

                        {/* UPLOAD TABS */}
                        <div className="bg-black/30 rounded-2xl border border-white/5 overflow-hidden mb-8">
                            <div className="grid grid-cols-2 border-b border-white/5">
                                <div className="p-4 bg-blue-500/10 text-center font-bold text-blue-400 border-r border-white/5">Paste URLs</div>
                                <div className="p-4 bg-purple-500/10 text-center font-bold text-purple-400">Upload Files</div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Method A */}
                                <div>
                                    <textarea
                                        value={pasteUrls} onChange={e => setPasteUrls(e.target.value)}
                                        placeholder="Paste image URLs here (one per line)..."
                                        className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white mb-2 focus:border-blue-500 outline-none"
                                    />
                                    <button onClick={handlePasteUrls} disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-sm transition-colors">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add URLs"}
                                    </button>
                                </div>

                                {/* Method B: Custom Dropzone */}
                                <div className="relative">
                                    <input
                                        type="file" multiple accept="image/*"
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full h-full border-2 border-dashed border-purple-500/30 rounded-xl flex flex-col items-center justify-center p-6 transition-all hover:bg-purple-500/5 hover:border-purple-500 ${uploading ? 'opacity-50' : ''}`}>
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-purple-500 mb-2" />
                                                <span className="text-purple-400 font-bold text-sm">Drag Files Here</span>
                                                <span className="text-gray-500 text-xs">or click to browse</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOLDER CONTENTS */}
                        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {folderImages.map(img => (
                                <div key={img.id} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative group">
                                    <img src={img.url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-2 bg-red-600 rounded-full text-white hover:scale-110 transition-transform">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {folderImages.length === 0 && <div className="text-center text-gray-500 text-sm italic">Folder is empty.</div>}

                    </div>
                )}

            </div>
        </div>
    );
};

export default GalleryAdmin;