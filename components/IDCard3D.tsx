import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IDCard } from '../types';

interface IDCard3DProps {
    card: IDCard;
    className?: string;
    isFlipped?: boolean;
    onFlip?: () => void;
    mode?: '3d' | 'static-front' | 'static-back';
    variant?: 'standard' | 'premium'; // Unlocks the Red Beast
}

const IDCard3D: React.FC<IDCard3DProps> = ({ card, className = '', isFlipped: controlledFlipped, onFlip, mode = '3d', variant = 'standard' }) => {
    const [internalFlipped, setInternalFlipped] = useState(false);
    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const handleFlip = () => {
        if (mode !== '3d') return;
        if (onFlip) {
            onFlip();
        } else {
            setInternalFlipped(!internalFlipped);
        }
    };

    const verificationUrl = `${window.location.origin}/#/verify-id/${card.uid}`;

    // --- STANDARD ASSETS ---
    const StandardShared = {
        dnaPattern: encodeURIComponent(`
          <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
              <path d='M10,0 Q50,50 10,100 M90,0 Q50,50 90,100' stroke='#D90429' fill='none' stroke-width='0.5' opacity='0.08'/>
              <circle cx='30' cy='25' r='1.5' fill='#D90429' opacity='0.1'/>
              <circle cx='70' cy='75' r='1.5' fill='#D90429' opacity='0.1'/>
          </svg>
      `)
    };

    // --- PREMIUM ASSETS ---
    // A richer, darker texture for the premium card
    const PremiumShared = {
        bgGradient: "bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-red-950 via-black to-red-900",
        glassOverlay: "bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl",
        textGlow: "drop-shadow-[0_0_5px_rgba(217,4,41,0.5)]"
    };

    // ==========================================
    // STANDARD DESIGN
    // ==========================================
    const StandardFront = () => (
        <div className="w-full h-full relative overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-gray-200">
            <div className="absolute inset-0 z-0" style={{ backgroundImage: `url("data:image/svg+xml,${StandardShared.dnaPattern}")` }} />

            {/* Header */}
            <div className="relative z-10 bg-gradient-to-r from-[#8B0000] to-[#D90429] h-28 clip-path-header flex items-center px-4 shadow-md has-clip-path">
                <style>{`.clip-path-header { clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); }`}</style>
                <div className="bg-white p-1 rounded-full shadow-lg mr-3 shrink-0">
                    <img
                        src="https://i.postimg.cc/Qtzp5v4x/ncss_crest_Nalanda_College_Science_Society_300x300_removebg_preview.png"
                        alt="NCSS"
                        className="w-12 h-12 object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-white text-[12px] font-black tracking-widest leading-tight">NALANDA COLLEGE<br />SCIENCE SOCIETY</h1>
                    <p className="text-white/80 text-[9px] italic font-serif mt-1">"{card.motto || "Adhipathi Vidya Labha"}"</p>
                </div>
            </div>

            {/* Profile */}
            <div className="relative z-10 flex flex-col items-center mt-6 px-4">
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-br from-[#D90429] to-red-900 shadow-xl mb-4 shrink-0">
                    {/* FIX: Explicit object-cover and rounded-full on img */}
                    <img
                        src={card.profileImage}
                        alt={card.fullName}
                        className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 uppercase text-center font-outfit leading-none mb-1 break-words w-full px-2">
                    {card.fullName}
                </h2>
                <p className="text-[#D90429] font-bold text-sm uppercase tracking-widest mb-4">
                    {card.position}
                </p>

                {/* Info Grid */}
                <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 grid grid-cols-2 gap-y-2 text-[10px] uppercase font-bold text-gray-500 text-center">
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Mem ID</span>
                        <span className="text-gray-900 text-xs">{card.memberId}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Batch</span>
                        <span className="text-gray-900 text-xs">{card.batch || "2025"}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Issued</span>
                        <span className="text-gray-900">{card.issuedDate || "JAN 2025"}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Expires</span>
                        <span className="text-gray-900">{card.expiryDate || "DEC 2026"}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto mb-4 px-6 flex justify-between items-end relative z-10">
                <div className="text-center">
                    <div className="font-cursive text-xl text-gray-800 -rotate-6 opacity-80 leading-none">
                        {card.secretaryName || "J.Doe"}
                    </div>
                    <div className="h-px w-20 bg-gray-400 mt-1"></div>
                    <p className="text-[8px] text-gray-500 uppercase mt-0.5">Secretary</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="h-6 flex items-end gap-[2px] opacity-70">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className={`h-full w-[2px] bg-black ${i % 2 === 0 ? 'w-[1px]' : 'w-[3px]'}`}></div>
                        ))}
                    </div>
                    <p className="text-[8px] text-gray-400 mt-0.5">NCSS-SECURE</p>
                </div>
            </div>
            <div className="h-2 bg-[#D90429] w-full mt-auto"></div>
        </div>
    );

    const StandardBack = () => (
        <div className="w-full h-full relative overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-gray-200">
            <div className="absolute inset-0 z-0" style={{ backgroundImage: `url("data:image/svg+xml,${StandardShared.dnaPattern}")` }} />

            <div className="h-16 bg-gray-900 flex items-center justify-center relative z-10 shrink-0">
                <h3 className="text-white text-sm font-bold tracking-[0.2em] uppercase">VERIFICATION</h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
                <div className="p-2 bg-white border-2 border-[#D90429] rounded-xl shadow-md mb-6 relative shrink-0">
                    <div className="absolute -inset-1 border border-gray-200 rounded-xl -z-10"></div>
                    <QRCodeSVG value={verificationUrl} size={150} fgColor="#000000" />
                </div>

                <p className="text-xs text-gray-500 font-medium mb-6 max-w-[200px]">
                    Scan this QR code to verify the authenticity of this membership card via the NCSS Portal.
                </p>

                {/* FIX: h-auto and break-all for text fixing */}
                <div className="w-full bg-gray-50 p-4 pb-6 rounded-xl border border-gray-200 text-left space-y-3 shadow-inner h-auto min-h-min">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#D90429] font-bold text-xs border border-red-100 shrink-0">@</div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Email</p>
                            <p className="text-xs font-bold text-gray-800 break-all">{card.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#D90429] font-bold text-xs border border-red-100 shrink-0">#</div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Phone</p>
                            <p className="text-xs font-bold text-gray-800">{card.phone}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-100 py-3 text-center border-t border-gray-200 relative z-10 shrink-0">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                    Property of Nalanda College Science Society
                </p>
            </div>
        </div>
    );

    // ==========================================
    // PREMIUM DESIGN (The Red Beast)
    // ==========================================
    const PremiumFront = () => (
        <div className={`w-full h-full relative overflow-hidden rounded-2xl shadow-2xl flex flex-col border border-red-900/50 ${PremiumShared.bgGradient}`}>
            {/* Ambient Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-800/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 h-28 flex items-center px-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="bg-black/40 p-2 rounded-full border border-red-500/30 mr-4 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                    <img
                        src="https://i.postimg.cc/Qtzp5v4x/ncss_crest_Nalanda_College_Science_Society_300x300_removebg_preview.png"
                        alt="NCSS"
                        className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                    />
                </div>
                <div>
                    <h1 className="text-white text-sm font-black tracking-[0.2em] leading-none mb-1 font-sans">
                        <span className="text-red-500">NCSS</span> ELITE
                    </h1>
                    <p className="text-red-200/60 text-[8px] uppercase tracking-widest">Science Society</p>
                </div>
                <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></div>
                </div>
            </div>

            {/* Profile */}
            <div className="relative z-10 flex flex-col items-center mt-8 px-4">
                <div className="relative w-36 h-36 mb-5 group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-600 animate-spin-slow blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-[2px] rounded-full bg-black z-10 flex items-center justify-center overflow-hidden border border-red-500/50">
                        <img
                            src={card.profileImage}
                            alt={card.fullName}
                            className="w-full h-full object-cover"
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                </div>

                <h2 className={`text-2xl font-black text-white uppercase text-center font-sans tracking-wide mb-1 ${PremiumShared.textGlow}`}>
                    {card.fullName}
                </h2>
                <div className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-md mb-6">
                    <p className="text-red-400 font-bold text-xs uppercase tracking-[0.2em]">
                        {card.position}
                    </p>
                </div>

                {/* Glass Info */}
                <div className={`w-full ${PremiumShared.glassOverlay} rounded-xl p-4 grid grid-cols-2 gap-4 text-center`}>
                    <div>
                        <span className="block text-red-400/60 text-[8px] uppercase font-bold tracking-wider mb-1">ID Number</span>
                        <span className="text-white font-mono text-xs">{card.memberId}</span>
                    </div>
                    <div>
                        <span className="block text-red-400/60 text-[8px] uppercase font-bold tracking-wider mb-1">Batch</span>
                        <span className="text-white font-mono text-xs">{card.batch}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Tech Deco */}
            <div className="mt-auto h-12 flex items-center justify-between px-6 border-t border-white/5 bg-black/40">
                <span className="text-[8px] text-red-500/50 font-mono tracking-widest">{card.issuedDate} // {card.expiryDate}</span>
                <span className="text-[8px] text-white/20 font-mono">SECURE ACCESS LEVEL 5</span>
            </div>
        </div>
    );

    const PremiumBack = () => (
        <div className={`w-full h-full relative overflow-hidden rounded-2xl shadow-2xl flex flex-col border border-red-900/50 ${PremiumShared.bgGradient}`}>
            {/* Tech Grid Background */}
            <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}></div>

            <div className="h-20 flex items-center justify-center relative z-10">
                <h3 className="text-white text-lg font-black tracking-[0.3em] uppercase drop-shadow-lg">
                    <span className="text-red-600">ID</span> VERIFY
                </h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
                <div className="p-3 bg-black/50 border border-red-500/50 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.15)] mb-8 backdrop-blur-xl relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-br from-red-500 to-transparent rounded-2xl opacity-50"></div>
                    <QRCodeSVG value={verificationUrl} size={140} fgColor="#FFFFFF" bgColor="transparent" />
                </div>

                <div className={`w-full ${PremiumShared.glassOverlay} rounded-xl p-5 text-left space-y-4`}>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500 border border-red-500/30">@</div>
                        <div className="min-w-0">
                            <p className="text-[8px] text-red-300/50 uppercase font-bold tracking-wider">Official Email</p>
                            <p className="text-xs text-white font-mono truncate">{card.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500 border border-red-500/30">#</div>
                        <div>
                            <p className="text-[8px] text-red-300/50 uppercase font-bold tracking-wider">Contact</p>
                            <p className="text-xs text-white font-mono">{card.phone}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-4 text-center relative z-10 border-t border-white/5">
                <p className="text-[8px] text-red-500/40 uppercase tracking-[0.2em] font-mono">
                    Official Document // NCSS // {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );


    // --- RENDERING MODES ---

    if (mode === 'static-front') {
        return (
            <div className={`w-[320px] h-[500px] ${className}`}>
                {variant === 'premium' ? <PremiumFront /> : <StandardFront />}
            </div>
        );
    }

    if (mode === 'static-back') {
        return (
            <div className={`w-[320px] h-[500px] ${className}`}>
                {variant === 'premium' ? <PremiumBack /> : <StandardBack />}
            </div>
        );
    }

    // DEFAULT 3D FLIP MODE
    return (
        <div
            className={`group w-[320px] h-[500px] perspective-1000 cursor-pointer ${className}`}
            onClick={handleFlip}
        >
            <div className={`relative w-full h-full duration-700 transform-style-3d transition-all ease-out ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* --- FRONT SIDE --- */}
                <div className="absolute w-full h-full backface-hidden">
                    {variant === 'premium' ? <PremiumFront /> : <StandardFront />}
                </div>

                {/* --- BACK SIDE --- */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    {variant === 'premium' ? <PremiumBack /> : <StandardBack />}
                </div>

            </div>
        </div>
    );
};

export default IDCard3D;
