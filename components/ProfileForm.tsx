import React, { useState } from 'react';
import { FirestoreUser } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Save, Loader2, User, Phone, Briefcase, Hash } from 'lucide-react';

interface ProfileFormProps {
    user: FirestoreUser;
    isEditing: boolean;
    onSave?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, isEditing, onSave }) => {
    const [formData, setFormData] = useState({
        displayName: user.displayName || user.name || '',
        phoneNumber: user.phoneNumber || '',
        position: user.position || '',
        grade: user.grade || '',
        indexNumber: user.indexNumber || ''
    });
    const [saving, setSaving] = useState(false);

    const checkChanged = () => {
        return (
            formData.displayName !== (user.displayName || user.name) ||
            formData.phoneNumber !== (user.phoneNumber || '') ||
            formData.position !== (user.position || '') ||
            formData.grade !== (user.grade || '') ||
            formData.indexNumber !== (user.indexNumber || '')
        );
    }

    const handleSave = async () => {
        if (!user.id) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.id), {
                displayName: formData.displayName,
                name: formData.displayName, // Sync for compatibility
                phoneNumber: formData.phoneNumber,
                position: formData.position,
                grade: formData.grade,
                indexNumber: formData.indexNumber
            });
            if (onSave) onSave();
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Name */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                        <User className="w-3 h-3" /> Full Name
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full glass-input p-3 rounded-xl font-bold text-white border border-white/10 focus:border-red-500 outline-none bg-black/50"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        />
                    ) : (
                        <div className="p-3 bg-white/5 rounded-xl text-white font-bold border border-transparent">
                            {user.displayName || user.name}
                        </div>
                    )}
                </div>

                {/* Phone Number */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                        <Phone className="w-3 h-3" /> Phone Number
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full glass-input p-3 rounded-xl font-mono text-white border border-white/10 focus:border-red-500 outline-none bg-black/50"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    ) : (
                        <div className="p-3 bg-white/5 rounded-xl text-gray-300 font-mono border border-transparent">
                            {user.phoneNumber || 'Not Set'}
                        </div>
                    )}
                </div>

                {/* Position */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                        <Briefcase className="w-3 h-3" /> Position / Role
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full glass-input p-3 rounded-xl text-white border border-white/10 focus:border-red-500 outline-none bg-black/50"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        />
                    ) : (
                        <div className="p-3 bg-white/5 rounded-xl text-gray-300 border border-transparent">
                            {user.position || 'Member'}
                        </div>
                    )}
                </div>

                {/* Grade */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                        <Hash className="w-3 h-3" /> Grade / Batch
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full glass-input p-3 rounded-xl text-white border border-white/10 focus:border-red-500 outline-none bg-black/50"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        />
                    ) : (
                        <div className="p-3 bg-white/5 rounded-xl text-gray-300 border border-transparent">
                            {user.grade || 'N/A'}
                        </div>
                    )}
                </div>

                {/* Index Number */}
                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                        <Hash className="w-3 h-3" /> Index Number (School ID)
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full glass-input p-3 rounded-xl font-mono text-white border border-white/10 focus:border-red-500 outline-none bg-black/50"
                            value={formData.indexNumber}
                            onChange={(e) => setFormData({ ...formData, indexNumber: e.target.value })}
                        />
                    ) : (
                        <div className="p-3 bg-white/5 rounded-xl text-gray-300 font-mono border border-transparent">
                            {user.indexNumber || 'N/A'}
                        </div>
                    )}
                </div>
            </div>

            {isEditing && checkChanged() && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileForm;
