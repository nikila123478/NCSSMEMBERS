import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { IDCard } from '../../types';
import IDCard3D from '../../components/IDCard3D';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loader, CheckCircle, Trash2, Edit, FileDown, Lock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PremiumIDCardWrapper from '../../components/PremiumIDCard';

const GenerateID = () => {
    const { currentUser } = useStore();
    const navigate = useNavigate();

    // Access States
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // Page States
    const [generating, setGenerating] = useState(false);
    const [existingCard, setExistingCard] = useState<IDCard | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [cardDesign, setCardDesign] = useState<'standard' | 'premium'>('standard');
    const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
    const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
    const [secretCode, setSecretCode] = useState('');

    const [formData, setFormData] = useState({
        profileImage: '',
        fullName: '',
        memberId: '',
        position: '',
        phone: '+94 ',
        email: '',
        motto: 'Adhipathi Vidya Labha',
        batch: '2025',
        issuedDate: 'JAN 2025',
        expiryDate: 'DEC 2026',
        secretaryName: 'J. Doe'
    });

    // Refs
    const printFrontRef = useRef<HTMLDivElement>(null);
    const printBackRef = useRef<HTMLDivElement>(null);

    // Secret Code Logic
    const handleSecretCode = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSecretCode(val);
        if (val === '20083261982228') {
            setIsPremiumUnlocked(true);
            setCardDesign('premium');
            alert("Premium Design Unlocked!");
        }
    };

    // --- GATEKEEPER LOGIC ---
    useEffect(() => {
        let isMounted = true;

        const checkAccess = async () => {
            if (!currentUser) return;

            // 1. Check Admin Privilege (Bypass)
            const isAdmin = ['SUPER_ADMIN', 'MEMBER_ADMIN', 'super_admin', 'admin'].includes(currentUser.role || '');

            // 2. Check Session Storage (Stability Fix)
            const isUnlocked = sessionStorage.getItem('id_access_unlocked') === 'true';

            if (isAdmin || isUnlocked) {
                // ACCESS GRANTED
                if (isMounted) setAuthorized(true);

                // Fetch ID Card Data
                try {
                    const docRef = doc(db, 'idCards', currentUser.id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && isMounted) {
                        setExistingCard(docSnap.data() as IDCard);
                    }
                    // Pre-fill form
                    if (isMounted) {
                        setFormData(prev => ({
                            ...prev,
                            fullName: currentUser.name || '',
                            email: currentUser.email || ''
                        }));
                    }
                } catch (e) {
                    console.error("Error fetching card:", e);
                } finally {
                    if (isMounted) setLoading(false);
                }

            } else {
                // ACCESS DENIED
                console.warn("Unauthorized Access Attempt to ID Gen");
                if (isMounted) setLoading(false);
                setTimeout(() => navigate('/'), 1000);
            }
        };

        checkAccess();
        return () => { isMounted = false; };
    }, [currentUser, navigate]);


    // HANDLERS
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !currentUser.id) return;

        setGenerating(true);
        try {
            const newCard: IDCard = {
                uid: currentUser.id,
                email: currentUser.email || formData.email,
                fullName: formData.fullName,
                memberId: formData.memberId,
                position: formData.position,
                profileImage: formData.profileImage,
                phone: formData.phone,
                generatedAt: new Date().toISOString(),
                motto: formData.motto,
                batch: formData.batch,
                issuedDate: formData.issuedDate,
                expiryDate: formData.expiryDate,
                secretaryName: formData.secretaryName
            };

            await setDoc(doc(db, 'idCards', currentUser.id), newCard);
            setExistingCard(newCard);
            alert("Success! ID Card Updated.");
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to save card.");
        } finally {
            setGenerating(false);
        }
    };

    const handleEdit = () => {
        if (!existingCard) return;
        setFormData({
            ...formData,
            ...existingCard,
            motto: existingCard.motto || formData.motto,
            batch: existingCard.batch || formData.batch,
            issuedDate: existingCard.issuedDate || formData.issuedDate,
            expiryDate: existingCard.expiryDate || formData.expiryDate,
            secretaryName: existingCard.secretaryName || formData.secretaryName
        });
        setExistingCard(null);
    };

    const handleDelete = async () => {
        if (!currentUser || !currentUser.id || !confirm("Are you sure? This will delete your ID.")) return;
        try {
            await deleteDoc(doc(db, 'idCards', currentUser.id));
            setExistingCard(null);
            setFormData(prev => ({ ...prev, memberId: '', position: 'Member' }));
        } catch (error) {
            console.error(error);
            alert("Delete failed.");
        }
    };

    const handleDownload = async (side: 'front' | 'back', format: 'png' | 'pdf') => {
        setDownloading(true);
        try {
            await new Promise(r => setTimeout(r, 500)); // Wait for render

            let canvas;

            if (cardDesign === 'premium') {
                // --- PREMIUM DOWNLOAD (Off-Screen Fixed Size) ---
                const targetId = side === 'front' ? 'hidden-premium-front' : 'hidden-premium-back';
                const element = document.getElementById(targetId);

                if (!element) throw new Error("Premium Element not found");

                // Make visible temporarily for capture
                if (element.parentElement) element.parentElement.style.visibility = 'visible';

                canvas = await html2canvas(element, {
                    scale: 3, // Very High Quality (1800x3150)
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false,
                    width: 600,
                    height: 1050,
                    onclone: (clonedDoc) => {
                        // Ensure the cloned element respects the fixed size
                        const clonedEl = clonedDoc.getElementById(targetId);
                        if (clonedEl) {
                            clonedEl.style.width = '600px';
                            clonedEl.style.height = '1050px';
                        }
                    }
                });

                // Hide again
                if (element.parentElement) element.parentElement.style.visibility = 'hidden';

            } else {
                // --- STANDARD DOWNLOAD (Existing Logic) ---
                const ref = side === 'front' ? printFrontRef.current : printBackRef.current;
                if (!ref) return;

                canvas = await html2canvas(ref, {
                    useCORS: true,
                    scale: 3,
                    backgroundColor: '#ffffff',
                    allowTaint: true,
                    logging: false,
                    onclone: (clonedDoc) => {
                        // Standard fixes...
                        const profileImgs = clonedDoc.getElementsByTagName('img');
                        Array.from(profileImgs).forEach((img: any) => {
                            if (img.src === existingCard?.profileImage || img.classList.contains('object-cover')) {
                                img.style.setProperty('object-fit', 'cover', 'important');
                                img.style.setProperty('aspect-ratio', '1 / 1', 'important');
                                img.style.setProperty('border-radius', '50%', 'important');
                                img.style.setProperty('width', '144px', 'important');
                                img.style.setProperty('height', '144px', 'important');
                            }
                        });
                        const wrappers = clonedDoc.querySelectorAll('.p-4');
                        wrappers.forEach((wrapper: any) => {
                            wrapper.style.setProperty('height', 'auto', 'important');
                            wrapper.style.setProperty('overflow', 'visible', 'important');
                        });
                    }
                });
            }

            if (!canvas) return;

            const dataUrl = canvas.toDataURL('image/png');

            if (format === 'png') {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `NCSS_ID_${existingCard.memberId}_${side}_${cardDesign}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // PDF Logic - Always Portrait
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = 210;
                const pdfHeight = 297;

                // Target width on PDF (Standard ID size approx 85.6mm, let's make it larger for print)
                // For premium (vertical), let's use 100mm width to fit nicely
                const targetWidth = 100;
                const imgProps = pdf.getImageProperties(dataUrl);
                const targetHeight = (imgProps.height * targetWidth) / imgProps.width;

                const x = (pdfWidth - targetWidth) / 2;
                const y = (pdfHeight - targetHeight) / 2;

                pdf.text(`NCSS OFFICIAL ID (${side.toUpperCase()})`, pdfWidth / 2, 30, { align: 'center' });
                pdf.addImage(dataUrl, 'PNG', x, y, targetWidth, targetHeight);
                pdf.save(`NCSS_ID_${existingCard.memberId}_${side}_${cardDesign}.pdf`);
            }

        } catch (err) {
            console.error("Download Error:", err);
            alert("Download failed. Please check your connection and try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading || !authorized) {
        // Should add loading spinner here actually, but keeping consistent with original style which might handled by parent or empty
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader className="w-10 h-10 text-red-600 animate-spin" /></div>;
    }

    if (!currentUser) return <div className="p-10 text-white">Please log in.</div>;

    return (
        <div className="min-h-screen text-white bg-black relative pt-32 px-6 md:px-10 pb-10">

            {/* HIDDEN CONTAINERS FOR SPLIT DOWNLOAD */}
            {/* HIDDEN CONTAINERS FOR SPLIT DOWNLOAD */}
            {existingCard && (
                <>
                    {/* STANDARD PORTRAIT RENDER (Hidden) */}
                    <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', opacity: 0 }}>
                        <div ref={printFrontRef} className="p-4 bg-white">
                            <IDCard3D card={existingCard} mode="static-front" variant="standard" />
                        </div>
                        <div ref={printBackRef} className="p-4 bg-white">
                            <IDCard3D card={existingCard} mode="static-back" variant="standard" />
                        </div>
                    </div>

                    {/* PREMIUM VERTICAL RENDER (Hidden, Fixed Size 600x1050) */}
                    <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', visibility: 'hidden' }}>
                        <div id="hidden-premium-front">
                            <PremiumIDCardWrapper user={existingCard} isForDownload={true} side="front" />
                        </div>
                        <div id="hidden-premium-back">
                            <PremiumIDCardWrapper user={existingCard} isForDownload={true} side="back" />
                        </div>
                    </div>
                </>
            )}

            <h1 className="text-3xl font-bold mb-8 text-white"><span className="text-[#D90429]">NCSS</span> ID Portal</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">

                {/* FORM SECTION */}
                {!existingCard ? (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-[#D90429]" />
                            {formData.memberId ? "Edit Details" : "New Registration"}
                        </h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400">Profile Image URL</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="url" name="profileImage" required
                                        value={formData.profileImage} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Full Name</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="fullName" required
                                        value={formData.fullName} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400">Member ID</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="memberId" required
                                        value={formData.memberId} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Position</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="position" required
                                        value={formData.position} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Phone</label>
                                <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                    type="tel" name="phone" required
                                    value={formData.phone} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs font-bold text-[#D90429] mb-3 uppercase tracking-wider">Card Details (Editable)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400">Motto</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="motto" value={formData.motto} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Batch</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="batch" value={formData.batch} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Issued</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="issuedDate" value={formData.issuedDate} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Expires</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="expiryDate" value={formData.expiryDate} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-400">Secretary Sign Name</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="secretaryName" value={formData.secretaryName} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={generating}
                                className="w-full mt-4 bg-[#D90429] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50">
                                {generating ? "Processing..." : "Save ID Card"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">ID Card Active</h2>
                        <p className="text-gray-400 text-sm mb-6">Verified Membership.</p>

                        <div className="space-y-4">
                            {/* FRONT CARD DOWNLOADS */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Front Side</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleDownload('front', 'png')} disabled={downloading}
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all text-xs font-bold border border-white/10">
                                        {downloading ? <Loader className="w-3 h-3 animate-spin" /> : "PNG"}
                                    </button>
                                    <button onClick={() => handleDownload('front', 'pdf')} disabled={downloading}
                                        className="flex items-center justify-center gap-2 bg-[#D90429]/20 hover:bg-[#D90429]/40 text-[#D90429] py-2 rounded-lg transition-all text-xs font-bold border border-[#D90429]/30">
                                        {downloading ? <Loader className="w-3 h-3 animate-spin" /> : "PDF"}
                                    </button>
                                </div>
                            </div>

                            {/* BACK CARD DOWNLOADS */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Back Side</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleDownload('back', 'png')} disabled={downloading}
                                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all text-xs font-bold border border-white/10">
                                        {downloading ? <Loader className="w-3 h-3 animate-spin" /> : "PNG"}
                                    </button>
                                    <button onClick={() => handleDownload('back', 'pdf')} disabled={downloading}
                                        className="flex items-center justify-center gap-2 bg-[#D90429]/20 hover:bg-[#D90429]/40 text-[#D90429] py-2 rounded-lg transition-all text-xs font-bold border border-[#D90429]/30">
                                        {downloading ? <Loader className="w-3 h-3 animate-spin" /> : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                                <button onClick={handleEdit}
                                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10">
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-all border border-red-500/20">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* PREVIEW SECTION (Right Column) */}
                <div className="flex flex-col items-center">

                    {/* DESIGN SELECTOR UI */}
                    <div className="bg-white/5 border border-white/10 p-1 rounded-xl mb-6 flex relative w-full max-w-[320px]">
                        <button
                            onClick={() => setCardDesign('standard')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${cardDesign === 'standard' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                            Standard
                        </button>
                        <button
                            onClick={() => isPremiumUnlocked && setCardDesign('premium')}
                            disabled={!isPremiumUnlocked}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${cardDesign === 'premium' ? 'bg-gradient-to-r from-red-600 to-red-900 text-white shadow-lg' : 'text-gray-500'} ${!isPremiumUnlocked ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-400'}`}>
                            {!isPremiumUnlocked && <Lock className="w-3 h-3" />}
                            Premium
                        </button>
                    </div>

                    {/* Secret Code Input (Only if Locked) */}
                    {!isPremiumUnlocked && (
                        <div className="mb-6 w-full max-w-[320px]">
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">
                                Enter Access Code to Unlock Premium
                            </label>
                            <input
                                type="text"
                                value={secretCode}
                                onChange={handleSecretCode}
                                placeholder="Code: 2008..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-center tracking-widest focus:border-red-500/50 outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>
                    )}

                    {isPremiumUnlocked && (
                        <p className="text-red-500 text-[10px] text-center mt-[-10px] mb-4 font-bold animate-pulse">
                            PREMIUM DESIGN UNLOCKED
                        </p>
                    )}

                    <p className="text-gray-500 text-xs mb-4 font-bold tracking-widest uppercase items-center flex gap-2">
                        <Lock className="w-3 h-3" /> Public Access Restricted
                    </p>
                    <div className="scale-90 md:scale-100 transition-transform">
                        {cardDesign === 'premium' ? (
                            <div className="w-full max-w-[320px]">
                                {/* SCALE WRAPPER FOR PREVIEW */}
                                {/* Premium Vertical is 600x1050. Scale 0.5 makes it 300x525. Fits well in 320px col. */}
                                <PremiumIDCardWrapper
                                    user={existingCard || {
                                        uid: currentUser.id,
                                        email: currentUser.email || 'email@...',
                                        fullName: formData.fullName || 'YOUR NAME',
                                        memberId: formData.memberId || 'NCSS-000',
                                        position: formData.position || 'MEMBER',
                                        profileImage: formData.profileImage || 'https://via.placeholder.com/300',
                                        phone: formData.phone || '+94...',
                                        generatedAt: new Date().toISOString(),
                                        motto: formData.motto,
                                        batch: formData.batch,
                                        issuedDate: formData.issuedDate,
                                        expiryDate: formData.expiryDate,
                                        secretaryName: formData.secretaryName
                                    }}
                                    side={previewSide}
                                    scale={0.5} // Scale down for preview
                                />

                                <button
                                    onClick={() => setPreviewSide(prev => prev === 'front' ? 'back' : 'front')}
                                    className="mt-6 flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-all border border-white/20 hover:border-white/40"
                                >
                                    <RefreshCw className="w-4 h-4" /> Flip Card
                                </button>
                            </div>
                        ) : (
                            <IDCard3D
                                card={existingCard || {
                                    uid: currentUser.id,
                                    email: currentUser.email || 'email@...',
                                    fullName: formData.fullName || 'YOUR NAME',
                                    memberId: formData.memberId || 'NCSS-000',
                                    position: formData.position || 'MEMBER',
                                    profileImage: formData.profileImage || 'https://via.placeholder.com/300',
                                    phone: formData.phone || '+94...',
                                    generatedAt: new Date().toISOString(),
                                    motto: formData.motto,
                                    batch: formData.batch,
                                    issuedDate: formData.issuedDate,
                                    expiryDate: formData.expiryDate,
                                    secretaryName: formData.secretaryName
                                }}
                                mode="3d"
                                variant="standard"
                            />
                        )}
                    </div>
                </div>

            </div >
        </div >
    );
};

export default GenerateID;
