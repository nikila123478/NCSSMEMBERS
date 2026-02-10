import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Trash2, Layout, Type, Upload, Loader2, X, Link as LinkIcon, Plus, Palette, BarChart3, HelpCircle } from 'lucide-react';
import { db, storage } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CMSData } from '../types';

const SiteEditor: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'theme' | 'about' | 'contact' | 'stats'>('theme');

    // Initial State matching CMSData interface
    const [form, setForm] = useState<CMSData>({
        heroTitle: "EXPLORE THE UNIVERSE",
        heroSubtitle: "Join the NCSS on a journey through space, science, and innovation.",
        heroImages: [],
        heroRedSaturation: 0,
        globalOverlayColor: '#000000',
        globalOverlayOpacity: 50,
        heroButtonText: "Join Society",
        heroTitleColor: "#ffffff",
        heroButtonColor: "#dc2626",
        heroOverlayColor: "rgba(0,0,0,0.5)",


        missionTitle: "Our Mission",
        missionText: "To inspire the next generation...",
        visionTitle: "Our Vision",
        visionText: "A world where scientific literacy...",
        aboutText: "NCSS is dedicated to...",
        aboutImages: [],
        teamMembers: [], // Initial state

        contactIntro: "Get in touch with us for any inquiries.",
        helpFaqContent: "Frequently Asked Questions...",
        googleMapsEmbed: '<iframe src="https://www.google.com/maps/embed?pb=..."></iframe>', // Deprecated but kept for type safety
        googleMapUrl: "",
        helpTitle: "Help & Support",
        helpSubtitle: "Frequently Asked Questions",
        faqList: [], // Initial state

        phoneNumber1: "",
        phoneNumber2: "",
        officialEmail: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        openingHours: "",

        stats: {
            membersConfig: 1500,
            projectsConfig: 45,
            awardsConfig: 12,
            legacyConfig: 25
        },

        socialLinks: [
            { id: '1', name: 'Facebook', url: 'https://facebook.com' },
            { id: '2', name: 'Instagram', url: 'https://instagram.com' }
        ]
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<'hero' | 'about'>('hero'); // Track which section we are uploading to

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'homepage');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Merge with default state to ensure all fields exist
                    const fd = docSnap.data() as CMSData;
                    setForm(prev => ({
                        ...prev,
                        ...fd,
                        faqList: fd.faqList || [],
                        teamMembers: fd.teamMembers || []
                    }));
                } else {
                    // Create default if not exists
                    await setDoc(docRef, form);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const saveHeroImage = async () => {
        try {
            await setDoc(doc(db, 'settings', 'homepage'), {
                heroBackgroundImageUrl: form.heroBackgroundImageUrl || ''
            }, { merge: true });
            alert("Hero Image Updated Successfully!");
        } catch (error) {
            console.error("Error saving hero image:", error);
            alert("Failed to update image.");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'homepage'), form);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async () => {
        if (!imageFile) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `site_assets/${uploadType}_${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const downloadUrl = await getDownloadURL(storageRef);

            if (uploadType === 'hero') {
                const newImages = [...form.heroImages, downloadUrl];
                setForm(prev => ({ ...prev, heroImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { heroImages: newImages }, { merge: true });
            } else {
                const newImages = [...form.aboutImages, downloadUrl];
                setForm(prev => ({ ...prev, aboutImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { aboutImages: newImages }, { merge: true });
            }
            setImageFile(null);
            alert("Image uploaded and saved!");
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteSlide = async (url: string, type: 'hero' | 'about') => {
        if (!window.confirm("Delete this image?")) return;
        try {
            if (type === 'hero') {
                const newImages = form.heroImages.filter(img => img !== url);
                setForm(prev => ({ ...prev, heroImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { heroImages: newImages }, { merge: true });
            } else {
                const newImages = form.aboutImages.filter(img => img !== url);
                setForm(prev => ({ ...prev, aboutImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { aboutImages: newImages }, { merge: true });
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("Failed to delete image.");
        }
    };

    const handleAddSlideUrl = async (url: string, type: 'hero' | 'about') => {
        if (!url) return;
        try {
            if (type === 'hero') {
                const newImages = [...form.heroImages, url];
                setForm(prev => ({ ...prev, heroImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { heroImages: newImages }, { merge: true });
            } else {
                const newImages = [...form.aboutImages, url];
                setForm(prev => ({ ...prev, aboutImages: newImages }));
                await setDoc(doc(db, 'settings', 'homepage'), { aboutImages: newImages }, { merge: true });
            }
            alert("Image URL added!");
        } catch (error) {
            console.error("Error adding image URL:", error);
            alert("Failed to add image URL.");
        }
    };

    // Helper to update specific stat fields
    const updateStat = (key: keyof typeof form.stats, value: number) => {
        setForm(prev => ({
            ...prev,
            stats: { ...prev.stats, [key]: value }
        }));
    };

    // Social Links Helpers
    const addSocialLink = () => {
        const newLink = { id: Date.now().toString(), name: 'Platform', url: 'https://' };
        setForm(prev => ({ ...prev, socialLinks: [...prev.socialLinks, newLink] }));
    };

    const updateSocialLink = (id: string, field: 'name' | 'url', value: string) => {
        setForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)
        }));
    };

    const removeSocialLink = (id: string) => {
        setForm(prev => ({ ...prev, socialLinks: prev.socialLinks.filter(l => l.id !== id) }));
    };


    if (loading) return <div className="p-8 text-center text-white">Loading editor...</div>;

    return (
        <div className="space-y-8 animate-fade-in text-gray-800 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white">Site Editor</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
                </button>
            </div>

            {/* Main Editor Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-gray-200/20">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {[
                        { id: 'theme', label: 'Global Theme', icon: Palette },
                        { id: 'home-hero', label: 'Home Hero', icon: Layout },
                        { id: 'about', label: 'About Content', icon: Type },
                        { id: 'contact', label: 'Contact & Help', icon: HelpCircle },
                        { id: 'stats', label: 'Home Stats', icon: BarChart3 },

                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-8 py-5 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'border-red-600 text-red-600 bg-red-50'
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-8">

                    {/* 1. GLOBAL THEME TAB */}
                    {activeTab === 'theme' && (
                        <div className="space-y-10 max-w-4xl">
                            {/* Hero Saturation */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-red-600" /> Hero Red Glow Intensity/Brightness
                                </h3>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={form.heroRedSaturation}
                                        onChange={e => setForm({ ...form, heroRedSaturation: parseInt(e.target.value) })}
                                        className="flex-1 accent-red-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-red-600 w-12">{form.heroRedSaturation}%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Controls the intensity of the "Red Heat" filter on the main Home slider.</p>
                            </div>

                            {/* Global Overlay */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-blue-600" /> Global Image Overlay
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Overlay Color</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="color"
                                                value={form.globalOverlayColor}
                                                onChange={e => setForm({ ...form, globalOverlayColor: e.target.value })}
                                                className="w-16 h-16 rounded-xl cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-gray-600">{form.globalOverlayColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Intensity / Opacity</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={form.globalOverlayOpacity}
                                                onChange={e => setForm({ ...form, globalOverlayOpacity: parseInt(e.target.value) })}
                                                className="flex-1 accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="font-mono font-bold text-blue-600 w-12">{form.globalOverlayOpacity}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Background Image URL */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-purple-600" /> Hero Background Image
                                </h3>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Hero Section Background Image URL</label>
                                    <input
                                        type="text"
                                        value={form.heroBackgroundImageUrl || ''}
                                        onChange={e => setForm({ ...form, heroBackgroundImageUrl: e.target.value })}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl font-mono text-xs text-blue-600"
                                        placeholder="https://i.postimg.cc/..."
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Paste a direct link to an image (e.g., from Postimages, Imgur). Leave empty for default.
                                        This will sit behind the slider or replace it if no slides are present.
                                    </p>
                                    <button
                                        onClick={saveHeroImage}
                                        className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                                    >
                                        <Save className="w-4 h-4" /> Update Image
                                    </button>
                                </div>
                            </div>

                            {/* Hero Slider Manager */}
                            <div>
                                <h3 className="text-lg font-bold mb-4">Hero Slider Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {form.heroImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                                            <img src={img} alt="Hero" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleDeleteSlide(img, 'hero')}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700"
                                                title="Delete Slide"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Upload Trigger */}
                                    <label className="flex flex-col items-center justify-center aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                        <span className="text-xs font-bold text-gray-500">Upload Slide</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setImageFile(e.target.files[0]);
                                                    setUploadType('hero');
                                                }
                                            }}
                                        />
                                    </label>

                                    {/* Add via URL Trigger */}
                                    <div className="flex flex-col items-center justify-center aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2">
                                        <LinkIcon className="w-6 h-6 text-gray-400 mb-2" />
                                        <span className="text-xs font-bold text-gray-500 mb-2">Add via URL</span>
                                        <div className="w-full flex gap-1">
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                className="w-full text-[10px] p-1 border rounded bg-white"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddSlideUrl(e.currentTarget.value, 'hero');
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {imageFile && uploadType === 'hero' && (
                                    <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <span className="text-sm font-bold text-blue-700">Selected: {imageFile.name}</span>
                                        <button onClick={handleImageUpload} disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                                            {uploading ? "Uploading..." : "Confirm Upload"}
                                        </button>
                                        <button onClick={() => setImageFile(null)} className="text-gray-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 1.5 HOME HERO TAB */}
                    {activeTab === 'home-hero' && (
                        <div className="space-y-8 max-w-4xl">
                            {/* Hero Text Content */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Type className="w-5 h-5 text-red-600" /> Hero Text Content
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Main Headline (Hero Title)</label>
                                        <input
                                            value={form.heroTitle}
                                            onChange={e => setForm({ ...form, heroTitle: e.target.value })}
                                            className="w-full p-4 bg-white border border-gray-200 rounded-xl font-black text-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sub Headline</label>
                                        <textarea
                                            rows={2}
                                            value={form.heroSubtitle}
                                            onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
                                            className="w-full p-4 bg-white border border-gray-200 rounded-xl font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Main Button Text</label>
                                        <input
                                            value={form.heroButtonText || ''}
                                            onChange={e => setForm({ ...form, heroButtonText: e.target.value })}
                                            className="w-full p-4 bg-white border border-gray-200 rounded-xl font-bold"
                                            placeholder="Join Society"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hero Colors */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-blue-600" /> Hero Colors & Theme
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Headline Color</label>
                                        <div className="flex gap-3 items-center bg-white p-2 rounded-xl border border-gray-200">
                                            <input
                                                type="color"
                                                value={form.heroTitleColor || '#ffffff'}
                                                onChange={e => setForm({ ...form, heroTitleColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-xs text-gray-600">{form.heroTitleColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Button Color</label>
                                        <div className="flex gap-3 items-center bg-white p-2 rounded-xl border border-gray-200">
                                            <input
                                                type="color"
                                                value={form.heroButtonColor || '#dc2626'}
                                                onChange={e => setForm({ ...form, heroButtonColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-xs text-gray-600">{form.heroButtonColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Overlay Tint</label>
                                        <div className="flex gap-3 items-center bg-white p-2 rounded-xl border border-gray-200">
                                            <input
                                                type="color"
                                                value={form.heroOverlayColor || '#000000'}
                                                onChange={e => setForm({ ...form, heroOverlayColor: e.target.value })}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                            />
                                            <span className="font-mono text-xs text-gray-600">{form.heroOverlayColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. ABOUT CONTENT TAB */}
                    {activeTab === 'about' && (
                        <div className="space-y-8 max-w-4xl">
                            {/* 1. Main Intro (Who We Are) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Main Intro / Who We Are</label>
                                <textarea
                                    rows={6}
                                    value={form.mainIntro}
                                    onChange={e => setForm({ ...form, mainIntro: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="The Nalanda College Science Society is..."
                                />
                            </div>

                            {/* 2. Vision & Mission */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Vision Statement</label>
                                    <textarea
                                        rows={4}
                                        value={form.visionText}
                                        onChange={e => setForm({ ...form, visionText: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        placeholder="To be the leading..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mission Statement</label>
                                    <textarea
                                        rows={4}
                                        value={form.missionText}
                                        onChange={e => setForm({ ...form, missionText: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        placeholder="To inspire and empower..."
                                    />
                                </div>
                            </div>

                            {/* 3. History & Legacy */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Our History / Legacy</label>
                                <textarea
                                    rows={6}
                                    value={form.historyText}
                                    onChange={e => setForm({ ...form, historyText: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                    placeholder="Founded in 19XX..."
                                />
                            </div>

                            {/* 4. President's Message */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">President's Message (Optional)</label>
                                <textarea
                                    rows={4}
                                    value={form.presidentMessage}
                                    onChange={e => setForm({ ...form, presidentMessage: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                    placeholder="Message from the president..."
                                />
                            </div>


                            {/* 5. TEAM MANAGER */}
                            <div className="pt-8 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">Meet Our Team</h3>
                                    <button
                                        onClick={() => setForm(prev => ({
                                            ...prev,
                                            teamMembers: [...(prev.teamMembers || []), { id: Date.now().toString(), name: '', role: '', imageUrl: '' }]
                                        }))}
                                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Add Member
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(form.teamMembers || []).map((member, idx) => (
                                        <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                            <div className="space-y-3">
                                                {/* Image Preview */}
                                                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto overflow-hidden border-2 border-gray-200">
                                                    {member.imageUrl ? (
                                                        <img src={member.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                    )}
                                                </div>

                                                <input
                                                    value={member.name}
                                                    onChange={e => {
                                                        const newList = [...(form.teamMembers || [])];
                                                        newList[idx].name = e.target.value;
                                                        setForm({ ...form, teamMembers: newList });
                                                    }}
                                                    className="w-full text-center font-bold text-sm outline-none border-b border-gray-200 focus:border-red-500 placeholder-gray-400"
                                                    placeholder="Member Name"
                                                />
                                                <input
                                                    value={member.role}
                                                    onChange={e => {
                                                        const newList = [...(form.teamMembers || [])];
                                                        newList[idx].role = e.target.value;
                                                        setForm({ ...form, teamMembers: newList });
                                                    }}
                                                    className="w-full text-center text-xs text-red-500 outline-none border-b border-gray-200 focus:border-red-500 placeholder-gray-300"
                                                    placeholder="Role / Position"
                                                />
                                                <input
                                                    value={member.imageUrl}
                                                    onChange={e => {
                                                        const newList = [...(form.teamMembers || [])];
                                                        newList[idx].imageUrl = e.target.value;
                                                        setForm({ ...form, teamMembers: newList });
                                                    }}
                                                    className="w-full text-center text-[10px] text-gray-400 outline-none border-b border-gray-200 focus:border-red-500 placeholder-gray-300"
                                                    placeholder="Image URL"
                                                />
                                                <p className="text-[9px] text-gray-400 text-center mt-1">Paste square image link for best results</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newList = form.teamMembers.filter(m => m.id !== member.id);
                                                    setForm({ ...form, teamMembers: newList });
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-50 text-red-500 rounded hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {(!form.teamMembers || form.teamMembers.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                        No team members added yet.
                                    </div>
                                )}
                            </div>

                            {/* Mini Carousel */}
                            <div>
                                <h3 className="text-lg font-bold mb-4">Mini Image Carousel</h3>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                                    {form.aboutImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                            <img src={img} alt="Mini" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setForm(prev => ({ ...prev, aboutImages: prev.aboutImages.filter((_, i) => i !== idx) }))}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="flex flex-col items-center justify-center aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                                        <Plus className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setImageFile(e.target.files[0]);
                                                    setUploadType('about');
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {imageFile && uploadType === 'about' && (
                                    <div className="flex items-center gap-4 bg-green-50 p-3 rounded-xl border border-green-100">
                                        <span className="text-sm font-bold text-green-700">Selected: {imageFile.name}</span>
                                        <button onClick={handleImageUpload} disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                                            {uploading ? "Uploading..." : "Add to Carousel"}
                                        </button>
                                        <button onClick={() => setImageFile(null)} className="text-gray-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. CONTACT & HELP TAB */}
                    {activeTab === 'contact' && (
                        <div className="space-y-8 max-w-4xl">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Contact Page Intro</label>
                                <textarea
                                    rows={5}
                                    value={form.contactIntro}
                                    onChange={e => setForm({ ...form, contactIntro: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>

                            {/* DYNAMIC CONTACT INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h3 className="text-lg font-bold col-span-full mb-2">Official Contact Details</h3>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number 1</label>
                                    <input value={form.phoneNumber1 || ''} onChange={e => setForm({ ...form, phoneNumber1: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="+94 77 ..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number 2 (Optional)</label>
                                    <input value={form.phoneNumber2 || ''} onChange={e => setForm({ ...form, phoneNumber2: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="+94 71 ..." />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Official Email</label>
                                    <input value={form.officialEmail || ''} onChange={e => setForm({ ...form, officialEmail: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="info@ncss.org" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Physical Address</label>
                                    <input value={form.addressLine1 || ''} onChange={e => setForm({ ...form, addressLine1: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2" placeholder="Line 1" />
                                    <input value={form.addressLine2 || ''} onChange={e => setForm({ ...form, addressLine2: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2" placeholder="Line 2" />
                                    <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="City / Country" />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opening Hours / Availability</label>
                                    <input value={form.openingHours || ''} onChange={e => setForm({ ...form, openingHours: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Mon - Fri: 8am - 4pm" />
                                </div>
                            </div>

                            {/* DYNAMIC FAQ MANAGER */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold">Help Page & FAQ Manager</h3>
                                    <button
                                        onClick={() => setForm(prev => ({
                                            ...prev,
                                            faqList: [...(prev.faqList || []), { id: Date.now().toString(), question: '', answer: '' }]
                                        }))}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Add Question
                                    </button>
                                </div>

                                {/* Header Config */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Page Title</label>
                                        <input
                                            value={form.helpTitle || ''}
                                            onChange={e => setForm({ ...form, helpTitle: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold"
                                            placeholder="How can we help?"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Page Subtitle</label>
                                        <input
                                            value={form.helpSubtitle || ''}
                                            onChange={e => setForm({ ...form, helpSubtitle: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                            placeholder="Subtitle text..."
                                        />
                                    </div>
                                </div>

                                {/* FAQ List */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {(form.faqList || []).map((faq, idx) => (
                                        <div key={faq.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                            <div className="mb-2">
                                                <input
                                                    value={faq.question}
                                                    onChange={e => {
                                                        const newList = [...form.faqList];
                                                        newList[idx].question = e.target.value;
                                                        setForm({ ...form, faqList: newList });
                                                    }}
                                                    className="w-full font-bold text-gray-800 outline-none border-b border-transparent focus:border-blue-500 placeholder-gray-400"
                                                    placeholder="Question..."
                                                />
                                            </div>
                                            <div>
                                                <textarea
                                                    rows={2}
                                                    value={faq.answer}
                                                    onChange={e => {
                                                        const newList = [...form.faqList];
                                                        newList[idx].answer = e.target.value;
                                                        setForm({ ...form, faqList: newList });
                                                    }}
                                                    className="w-full text-sm text-gray-600 outline-none resize-none placeholder-gray-300"
                                                    placeholder="Answer..."
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newList = form.faqList.filter(f => f.id !== faq.id);
                                                    setForm({ ...form, faqList: newList });
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-50 text-red-500 rounded hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!form.faqList || form.faqList.length === 0) && (
                                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                            No FAQs added yet.
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Embed URL (Src Link)</label>
                                <input
                                    type="text"
                                    value={form.googleMapUrl || ''}
                                    onChange={e => setForm({ ...form, googleMapUrl: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-600"
                                    placeholder="https://www.google.com/maps/embed?pb=..."
                                />
                                <p className="text-xs text-blue-600 mt-2 font-bold">
                                    Helper: Go to Google Maps -&gt; Share -&gt; Embed a Map -&gt; Copy ONLY the link inside src="..."
                                </p>
                            </div>




                            {/* SOCIAL MEDIA MANAGER */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-blue-600" /> Social Media Links
                                    </h3>
                                    <button
                                        onClick={() => setForm(prev => ({
                                            ...prev,
                                            socialLinks: [...(prev.socialLinks || []), { id: Date.now().toString(), name: '', url: '', iconUrl: '' }]
                                        }))}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Add Link
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {form.socialLinks?.map((link, idx) => (
                                        <div key={link.id} className="grid md:grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                            <div className="md:col-span-3">
                                                <input
                                                    value={link.name}
                                                    onChange={e => {
                                                        const newLinks = [...(form.socialLinks || [])];
                                                        newLinks[idx].name = e.target.value;
                                                        setForm({ ...form, socialLinks: newLinks });
                                                    }}
                                                    className="w-full text-sm font-bold border border-gray-200 rounded-lg p-2"
                                                    placeholder="Name (e.g. Facebook)"
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                                                    <img src={link.iconUrl || 'https://via.placeholder.com/20'} alt="icon" className="w-5 h-5 object-contain opacity-50" />
                                                    <input
                                                        value={link.iconUrl || ''}
                                                        onChange={e => {
                                                            const newLinks = [...(form.socialLinks || [])];
                                                            newLinks[idx].iconUrl = e.target.value;
                                                            setForm({ ...form, socialLinks: newLinks });
                                                        }}
                                                        className="w-full text-xs outline-none"
                                                        placeholder="Icon URL (PNG/SVG)"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-4">
                                                <input
                                                    value={link.url}
                                                    onChange={e => {
                                                        const newLinks = [...(form.socialLinks || [])];
                                                        newLinks[idx].url = e.target.value;
                                                        setForm({ ...form, socialLinks: newLinks });
                                                    }}
                                                    className="w-full text-xs text-blue-600 border border-gray-200 rounded-lg p-2"
                                                    placeholder="Profile Link (https://...)"
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        const newLinks = form.socialLinks.filter(l => l.id !== link.id);
                                                        setForm({ ...form, socialLinks: newLinks });
                                                    }}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!form.socialLinks || form.socialLinks.length === 0) && (
                                        <p className="text-center text-gray-400 text-sm py-4">No social links added.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. HOME STATS TAB */}
                    {activeTab === 'stats' && (
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-purple-600" /> Stats Counter Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { key: 'membersConfig', label: 'Active Members' },
                                    { key: 'projectsConfig', label: 'Projects Launched' },
                                    { key: 'awardsConfig', label: 'Awards Won' },
                                    { key: 'legacyConfig', label: 'Years of Legacy' }
                                ].map((stat) => (
                                    <div key={stat.key} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:border-purple-200 transition-colors">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{stat.label}</label>
                                        <input
                                            type="number"
                                            value={form.stats[stat.key as keyof typeof form.stats]}
                                            onChange={e => updateStat(stat.key as any, parseInt(e.target.value))}
                                            className="w-full text-3xl font-black bg-transparent border-none outline-none text-gray-900"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default SiteEditor;