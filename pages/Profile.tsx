import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const Profile: React.FC = () => {
    const { currentUser, updateUserProfile } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        grade: '',
        indexNumber: '',
        position: '',
        photoURL: ''
    });

    const [loading, setLoading] = useState(false);
    const [imageProcessing, setImageProcessing] = useState(false);

    // FIX 1: Fetch Data on Mount (Persistence)
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser?.id) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.id));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setFormData({
                            name: data.name || currentUser.name || '',
                            email: currentUser.email || '', // Email is usually consistent from Auth
                            phoneNumber: data.phoneNumber || '',
                            grade: data.grade || '',
                            indexNumber: data.indexNumber || '',
                            position: data.position || '',
                            photoURL: data.photoURL || ''
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Helper: Compress Image to Base64
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const scaleSize = MAX_WIDTH / img.width;
                    const newWidth = MAX_WIDTH;
                    const newHeight = img.height * scaleSize;

                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, newWidth, newHeight);

                    // Convert to Base64 JPEG with 0.7 quality
                    const base64String = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(base64String);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];

        // Validation: Check if it's an image
        if (!file.type.startsWith('image/')) {
            alert("Please select a valid image file.");
            return;
        }

        setImageProcessing(true);
        try {
            // Compress and convert to Base64
            const base64String = await compressImage(file);

            // Allow immediate state update for preview
            setFormData(prev => ({ ...prev, photoURL: base64String }));

            // Note: We don't save to Firestore here automatically anymore to ensure consistency. 
            // User must click "Save Changes" to finalize everything.
            alert("Image processed! Don't forget to click 'Save Changes'.");
        } catch (error) {
            console.error("Error processing image:", error);
            alert("Failed to process image.");
        } finally {
            setImageProcessing(false);
        }
    };

    // FIX 2: Robust Save Function
    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            // 1. Save to Firestore (Merge to keep existing fields)
            const userRef = doc(db, 'users', currentUser.id);
            await setDoc(userRef, {
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                grade: formData.grade,
                indexNumber: formData.indexNumber,
                position: formData.position,
                photoURL: formData.photoURL
            }, { merge: true });

            // Update local Context immediately
            await updateUserProfile({
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                grade: formData.grade,
                indexNumber: formData.indexNumber,
                position: formData.position,
                photoURL: formData.photoURL
            });

            // 2. Send to Google Sheets (Google Apps Script)
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzm0bhg2Y88C3LtzeafftRJAVedZFxJPk5fXeo1zVHQmWZi0pPgiH5eRcS7yv-SgCGsUA/exec";

            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phoneNumber,
                    grade: formData.grade,
                    indexNo: formData.indexNumber,
                    position: formData.position,
                    photoURL: formData.photoURL // Base64 String
                })
            });

            alert("Profile Saved Successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Home
                </button>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">My Profile</h1>
                <div className="w-20"></div> {/* Spacer for centering */}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -z-10" />

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Image Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden shadow-lg bg-gray-800 flex items-center justify-center">
                                {formData.photoURL ? (
                                    <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-500" />
                                )}
                                {imageProcessing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 p-2 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-colors"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="text-sm text-gray-400 text-center">Allowed: JPG, PNG <br /> Auto-Compressed</p>
                    </div>

                    {/* Form Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email <span className="text-red-500 text-[10px] ml-1">(Read Only)</span></label>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                readOnly
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="+94 7X XXX XXXX"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grade</label>
                            <select
                                name="grade"
                                value={formData.grade}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors [&>option]:text-black"
                            >
                                <option value="">Select Grade</option>
                                <option value="Grade 6">Grade 6</option>
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                                <option value="Grade 13">Grade 13</option>
                                <option value="Alumni">Alumni</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Index Number</label>
                            <input
                                type="text"
                                name="indexNumber"
                                value={formData.indexNumber}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="e.g. 23456"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Position (Thanathura)</label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="e.g. Secretary, Member, Treasurer"
                            />
                        </div>

                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4" /> Save Changes
                            </>
                        )}
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default Profile;
