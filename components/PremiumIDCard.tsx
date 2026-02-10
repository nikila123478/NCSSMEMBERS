import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IDCard } from '../types';

interface PremiumIDCardProps {
    user: IDCard;
    isForDownload?: boolean;
    scale?: number;
    side?: 'front' | 'back';
}

const PremiumIDCardWrapper: React.FC<PremiumIDCardProps> = ({
    user,
    isForDownload = false,
    scale = 1,
    side = 'front'
}) => {

    const baseWidth = 600;
    const baseHeight = 1050;

    // --- MAIN STYLES ---
    const cardStyle: React.CSSProperties = {
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
        fontFamily: "'Rajdhani', 'Outfit', sans-serif", // Tech/Sci-Fi Fonts
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transform: isForDownload ? 'none' : `scale(${scale})`,
        transformOrigin: 'top left',
        borderRadius: isForDownload ? '0' : '30px', // Square for print, Rounded for preview
        boxShadow: isForDownload ? 'none' : '0 20px 50px rgba(0,0,0,0.5)',
    };

    const wrapperStyle: React.CSSProperties = isForDownload ? {} : {
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale}px`,
        position: 'relative',
    };

    const verificationUrl = `${window.location.origin}/#/verify-id/${user.uid}`;

    // --- RENDER FRONT ---
    const RenderFront = () => (
        <div style={cardStyle}>
            {/* Inject Fonts */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=Rajdhani:wght@500;600;700&display=swap');`}
            </style>

            {/* --- BACKGROUND LAYERS --- */}

            {/* 1. Dark Red Gradient Base */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 40%, #5a0000 0%, #2a0000 50%, #050505 100%)',
                zIndex: 1
            }} />

            {/* 2. Red Atmosphere Glow */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 45%, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
                zIndex: 2
            }} />

            {/* 3. Hex Pattern Overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='25,5 40,15 40,35 25,45 10,35 10,15' fill='none' stroke='%23dc2626' stroke-width='0.5' opacity='0.15'/%3E%3Ccircle cx='25' cy='25' r='1.5' fill='%23dc2626' opacity='0.2'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px',
                opacity: 0.4,
                zIndex: 3
            }} />

            {/* --- CONTENT CONTAINER --- */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>

                {/* HEADER (Black Strip) */}
                <div style={{
                    height: '200px',
                    background: 'linear-gradient(to bottom, #0f0f0f, #1a1a1a, #0f0f0f)',
                    borderBottom: '2px solid rgba(220, 38, 38, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 30px',
                    position: 'relative',
                    boxShadow: '0 5px 30px rgba(0,0,0,0.8)'
                }}>
                    {/* Left Logo */}
                    <img
                        src="https://i.postimg.cc/Qtzp5v4x/ncss_crest_Nalanda_College_Science_Society_300x300_removebg_preview.png"
                        alt="Crest"
                        style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(220,38,38,0.5))' }}
                    />

                    {/* Center Text */}
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{
                            margin: 0, fontSize: '52px', fontWeight: 700, letterSpacing: '8px', color: 'white',
                            fontFamily: "'Rajdhani', sans-serif", lineHeight: 0.9,
                            textShadow: '0 0 20px rgba(220, 38, 38, 0.8)'
                        }}>
                            NCSS
                        </h1>
                        <div style={{
                            fontSize: '14px', letterSpacing: '4px', color: '#ffaaaa', textTransform: 'uppercase', fontWeight: 600
                        }}>
                            Science Society
                        </div>
                    </div>

                    {/* Right Logo */}
                    <img
                        src="https://i.postimg.cc/8PNKsrhx/Chat-GPT-Image-Feb-10-2026-05-40-56-PM-removebg-preview.png"
                        alt="Logo"
                        style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(220,38,38,0.5))' }}
                    />
                </div>

                {/* MAIN BODY */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '40px',
                    position: 'relative'
                }}>

                    {/* --- DECORATIVE ELEMENTS (Test Tubes) --- */}
                    {/* Left Test Tube Rack */}
                    <div style={{ position: 'absolute', left: '10px', top: '150px', width: '120px', height: '260px', opacity: 0.8, zIndex: 5 }}>
                        <svg viewBox="0 0 130 280" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))' }}>
                            <rect x="8" y="260" width="114" height="15" fill="#500" opacity="0.8" rx="3" />
                            <rect x="56" y="45" width="18" height="215" fill="#500" opacity="0.8" />
                            {/* Tubes */}
                            {[20, 44, 70, 94].map((x, i) => (
                                <g key={i}>
                                    <rect x={x} y={60 + (i * 5)} width="16" height="120" fill="rgba(220, 38, 38, 0.15)" stroke="#dc2626" strokeWidth="2" rx="8" />
                                    <rect x={x} y={120 + (i * 5)} width="16" height={60 - (i * 5)} fill="rgba(220, 38, 38, 0.6)" rx="8" />
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Right Flask */}
                    <div style={{ position: 'absolute', right: '0px', bottom: '160px', width: '150px', height: '220px', opacity: 0.8, zIndex: 5 }}>
                        <svg viewBox="0 0 160 240" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))' }}>
                            <path d="M 60 35 L 60 70 L 25 180 Q 25 205, 45 212 L 115 212 Q 135 205, 135 180 L 100 70 L 100 35 Z" fill="rgba(220, 38, 38, 0.15)" stroke="#dc2626" strokeWidth="2" />
                            <path d="M 40 160 Q 40 190, 55 198 L 105 198 Q 120 190, 120 160 L 95 95 L 65 95 Z" fill="rgba(220, 38, 38, 0.6)" />
                        </svg>
                    </div>

                    {/* PROFILE PICTURE */}
                    <div style={{
                        width: '300px', height: '300px', borderRadius: '50%', padding: '0',
                        marginBottom: '30px', position: 'relative', zIndex: 20
                    }}>
                        {/* Neon Rings */}
                        <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220, 38, 38, 0.5) 0%, transparent 70%)', filter: 'blur(15px)' }} />
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%', padding: '6px',
                            background: 'linear-gradient(135deg, #ff4d4d, #990000)',
                            boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
                        }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid black', backgroundColor: '#111' }}>
                                <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>
                    </div>

                    {/* NAME */}
                    <div style={{
                        fontSize: '48px', fontWeight: 900, color: 'white', textTransform: 'uppercase',
                        textAlign: 'center', lineHeight: 1, letterSpacing: '3px',
                        textShadow: '0 0 20px rgba(220, 38, 38, 0.8)', zIndex: 20, marginBottom: '5px',
                        fontFamily: "'Rajdhani', sans-serif"
                    }}>
                        {user.fullName}
                    </div>

                    {/* ROLE */}
                    <div style={{
                        fontSize: '24px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase',
                        letterSpacing: '6px', marginBottom: '40px', zIndex: 20
                    }}>
                        {user.position || "MEMBER"}
                    </div>

                    {/* DETAILS BOX (Glassmorphism) */}
                    <div style={{
                        width: '100%',
                        background: 'linear-gradient(145deg, rgba(20, 0, 0, 0.9), rgba(40, 0, 0, 0.9))',
                        border: '2px solid rgba(220, 38, 38, 0.5)',
                        borderRadius: '20px',
                        padding: '30px',
                        boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                        position: 'relative',
                        zIndex: 20
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                            {/* Mem ID */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>MEM ID</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>{user.memberId}</div>
                            </div>
                            {/* Batch */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>BATCH</div>
                                <div style={{ fontSize: '28px', fontWeight: 700 }}>{user.batch || '2026'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(220,38,38,0.3)', paddingTop: '20px' }}>
                            {/* Issued */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>ISSUED</div>
                                <div style={{ fontSize: '22px', fontWeight: 700 }}>{user.issuedDate || '2025'}</div>
                            </div>
                            {/* Expires */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>EXPIRES</div>
                                <div style={{ fontSize: '22px', fontWeight: 700 }}>DEC 2026</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

    // --- RENDER BACK ---
    const RenderBack = () => (
        <div style={cardStyle}>
            {/* Background */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 50%, #5a0000 0%, #2a0000 60%, #000000 100%)',
                zIndex: 1
            }} />

            {/* Hex Pattern */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='25,5 40,15 40,35 25,45 10,35 10,15' fill='none' stroke='%23dc2626' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E")`,
                opacity: 0.3, zIndex: 2
            }} />

            {/* Content */}
            <div style={{
                position: 'relative', zIndex: 10, height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px'
            }}>
                <h2 style={{
                    fontSize: '42px', fontWeight: 900, color: 'white', letterSpacing: '8px',
                    textShadow: '0 0 20px rgba(220, 38, 38, 0.8)', marginBottom: '10px'
                }}>
                    VERIFICATION
                </h2>
                <div style={{ height: '2px', width: '100px', background: '#dc2626', marginBottom: '50px', boxShadow: '0 0 10px red' }} />

                {/* QR Code Container */}
                <div style={{
                    padding: '25px', background: 'white', borderRadius: '15px',
                    boxShadow: '0 0 50px rgba(220, 38, 38, 0.5)', border: '4px solid rgba(220,38,38,0.5)', marginBottom: '40px'
                }}>
                    <QRCodeSVG value={verificationUrl} size={isForDownload ? 300 : 250} fgColor="#000" />
                </div>

                <p style={{ color: '#ffcccc', fontSize: '16px', textAlign: 'center', maxWidth: '80%', marginBottom: '60px', letterSpacing: '1px' }}>
                    Scan this QR code to verify the authenticity of this membership card via the NCSS Portal.
                </p>

                {/* Contact Box */}
                <div style={{
                    width: '100%', padding: '30px',
                    background: 'rgba(20, 0, 0, 0.8)', border: '1px solid rgba(220, 38, 38, 0.4)',
                    borderRadius: '15px', textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700 }}>EMAIL</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.email || 'ncss@nalanda.lk'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#ff6666', letterSpacing: '2px', fontWeight: 700 }}>PHONE</div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{user.phone}</div>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '30px', fontSize: '12px', color: '#ffd700', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                    Property of Nalanda College Science Society
                </div>
            </div>
        </div>
    );

    if (isForDownload) {
        return side === 'front' ? <RenderFront /> : <RenderBack />;
    }

    return (
        <div style={wrapperStyle}>
            {side === 'front' ? <RenderFront /> : <RenderBack />}
        </div>
    );
};

export default PremiumIDCardWrapper;