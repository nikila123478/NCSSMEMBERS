import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { GalleryImage, GalleryFolder } from '../types';
import { X, ZoomIn, Loader2, Folder, ArrowLeft } from 'lucide-react';

const Gallery: React.FC = () => {
    // --- STATE ---
    const [carouselUrls, setCarouselUrls] = useState<string[]>([]);
    const [folders, setFolders] = useState<GalleryFolder[]>([]);
    const [allImages, setAllImages] = useState<GalleryImage[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<GalleryFolder | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA ---
    useEffect(() => {
        // 1. Carousel
        getDoc(doc(db, 'settings', 'gallery_carousel')).then(s => {
            if (s.exists()) setCarouselUrls(s.data().urls || []);
        });

        // 2. Folders
        const unsubFolders = onSnapshot(query(collection(db, 'gallery_folders'), orderBy('createdAt', 'desc')), (snap) => {
            setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryFolder)));
        });

        // 3. Images (Fetch all once and filter client-side for smoother transition)
        const unsubImages = onSnapshot(query(collection(db, 'gallery_images'), orderBy('createdAt', 'desc')), (snap) => {
            setAllImages(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage)));
            setLoading(false);
        });

        return () => { unsubFolders(); unsubImages(); };
    }, []);

    // Helper: Get images for specific folder
    const getFolderImages = (folderId: string) => allImages.filter(img => img.parentFolderId === folderId);

    // --- RENDER ---
    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10 text-red-600" /></div>;

    const activeFolderImages = selectedFolder ? getFolderImages(selectedFolder.id) : [];

    return (
        <div className="min-h-screen bg-black text-white font-outfit overflow-x-hidden">

            {/* HERO: 3D CAROUSEL (Only visible when no folder selected or kept static?) 
                User request: "Top Section: 3D Carousel... Bottom Section: Image Grid"
                However, when folder is open, we usually focus on that. Let's keep Hero but maybe compact it?
                For now, full hero.
            */}
            {!selectedFolder && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="relative h-[60vh] md:h-screen w-full flex items-center justify-center overflow-hidden perspective-1000 border-b border-white/5"
                >
                    {/* Reuse existing 3D Logic */}
                    <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                        <div className="w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] animate-pulse" />
                    </div>
                    <div className="absolute z-20 flex flex-col items-center justify-center scale-75 md:scale-100">
                        <img
                            src="https://i.postimg.cc/Qtzp5v4x/ncss_crest_Nalanda_College_Science_Society_300x300_removebg_preview.png"
                            alt="NCSS Crest"
                            className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_50px_rgba(220,38,38,0.6)]"
                        />
                        <h1 className="mt-8 text-4xl font-black tracking-widest text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                            GALLERY
                        </h1>
                    </div>
                    <div className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-none perspective-origin-center transform-style-3d">
                        <div className="relative w-[300px] h-[200px] transform-style-3d animate-orbit">
                            {carouselUrls.map((url, index) => {
                                const angle = (index / carouselUrls.length) * 360;
                                return (
                                    <div
                                        key={index}
                                        className="absolute top-0 left-0 w-full h-full backface-visible transform-style-3d"
                                        style={{ transform: `rotateY(${angle}deg) translateZ(400px)` }}
                                    >
                                        <div className="w-full h-full rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 p-2">
                                            <img src={url} className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* MAIN CONTENT: FOLDERS / IMAGES */}
            <div className={`relative z-30 max-w-7xl mx-auto px-4 ${selectedFolder ? 'py-10' : 'py-20'} min-h-screen bg-black transition-all`}>

                <AnimatePresence mode="wait">
                    {/* VIEW 1: FOLDER GRID */}
                    {!selectedFolder ? (
                        <motion.div
                            key="folder-grid"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">Browse Collections</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {folders.map((folder) => (
                                    <motion.div
                                        key={folder.id}
                                        layoutId={`folder-${folder.id}`}
                                        onClick={() => setSelectedFolder(folder)}
                                        className="group cursor-pointer relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:border-red-500/30 transition-all aspect-[4/3]"
                                    >
                                        {/* Cover Image */}
                                        <div className="absolute inset-0">
                                            {folder.coverImage ? (
                                                <img src={folder.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-900 group-hover:bg-red-900/20 transition-colors">
                                                    <Folder className="w-20 h-20 text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-6">
                                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{folder.name}</h3>
                                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                                <Folder className="w-4 h-4" /> {getFolderImages(folder.id).length} items
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* VIEW 2: IMAGE SCATTER / GRID (The "Internal" View) */
                        <motion.div
                            key="folder-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Navigation Header */}
                            <motion.div
                                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                                className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl py-4 mb-8 flex items-center justify-between border-b border-white/10"
                            >
                                <button
                                    onClick={() => setSelectedFolder(null)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                                >
                                    <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20">
                                        <ArrowLeft className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">Back to Folders</span>
                                </button>
                                <h2 className="text-2xl font-bold text-white hidden md:block">{selectedFolder.name}</h2>
                            </motion.div>

                            {/* THE SCATTER ANIMATION GRID */}
                            <div className="columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                {activeFolderImages.map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.5, y: 100 }} // Starts small and low (mimicking scatter from center)
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: idx * 0.05, // Staggered reveal
                                            type: "spring",
                                            damping: 20
                                        }}
                                        onClick={() => setSelectedImage(img.url)}
                                        className="break-inside-avoid relative rounded-xl overflow-hidden cursor-pointer group bg-gray-900"
                                    >
                                        <img src={img.url} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {activeFolderImages.length === 0 && (
                                <div className="h-[50vh] flex flex-col items-center justify-center text-gray-500">
                                    <Folder className="w-16 h-16 mb-4 opacity-50" />
                                    <p>No images in this folder yet.</p>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* LIGHTBOX (Common) */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            src={selectedImage}
                            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
                        />
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white">
                            <X className="w-10 h-10" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-visible { backface-visibility: visible; }
                @keyframes orbit { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
                .animate-orbit { animation: orbit 40s linear infinite; }
            `}</style>
        </div>
    );
};

export default Gallery;
