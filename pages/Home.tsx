import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Facebook, Twitter, Instagram, Youtube, Linkedin, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { CMSData, RoutePath } from '../types';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

// Animated Counter Component
const AnimatedCounter = ({ value, label }: { value: number, label: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2.5,
      ease: "circOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
        {displayValue}+
      </span>
      <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Real-time Data Fetching
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists()) {
        setCmsData(doc.data() as CMSData);
      }
    });
    return () => unsub();
  }, []);

  // Slider Logic
  useEffect(() => {
    if (cmsData?.heroImages?.length) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % cmsData.heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [cmsData?.heroImages]);

  // Social Icon Helper
  const getSocialIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('facebook')) return <Facebook className="w-5 h-5" />;
    if (lower.includes('twitter') || lower.includes('x')) return <Twitter className="w-5 h-5" />;
    if (lower.includes('instagram')) return <Instagram className="w-5 h-5" />;
    if (lower.includes('youtube')) return <Youtube className="w-5 h-5" />;
    if (lower.includes('linkedin')) return <Linkedin className="w-5 h-5" />;
    if (lower.includes('whatsapp')) return <MessageCircle className="w-5 h-5" />;
    return <LinkIcon className="w-5 h-5" />;
  };

  if (!cmsData) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen w-full bg-black overflow-hidden font-outfit text-white relative">

      {/* 1. HERO BACKGROUND LOGIC (Dynamic URL > Slider > Default Pulse) */}
      {cmsData.heroBackgroundImageUrl ? (
        // A. Dynamic Single Image Background
        <div
          className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-neutral-900"
          style={{
            backgroundImage: `url('${cmsData.heroBackgroundImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-black/50" /> {/* Overlay for readability */}
        </div>
      ) : cmsData.heroImages && cmsData.heroImages.length > 0 ? (
        // B. Hero Slider (Fallback if no single image set)
        <div className="absolute inset-0 z-0">
          {cmsData.heroImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img
                src={img}
                alt={`Slide ${index}`}
                className="w-full h-full object-cover"
                style={{
                  filter: `saturate(${100 + (cmsData.heroRedSaturation || 0)}%) contrast(1.1)`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        // C. Default "Red Pulse" Fallback
        <div className="absolute inset-0 z-0 bg-neutral-900 flex items-center justify-center overflow-hidden">
          <div className="absolute w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[120px] filter animate-pulse" />
        </div>
      )}

      {/* 2. GLOBAL OVERLAY (Dynamic Color & Opacity) */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none mix-blend-overlay"
        style={{
          backgroundColor: cmsData.heroOverlayColor || cmsData.backgroundColor || cmsData.globalOverlayColor || '#000000',
          opacity: (cmsData.globalOverlayOpacity || 50) / 100
        }}

      />

      {/* Main Content Container (Responsive Padding and Flex) */}
      <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-20 max-w-7xl mx-auto pt-24 md:pt-32">

        {/* Hero Text */}
        <div className="max-w-4xl text-center md:text-left">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-4 leading-tight"
            style={{ color: cmsData.heroTitleColor || cmsData.globalHeadingColor || '#ffffff' }}
          >

            {cmsData.heroTitle}

          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-2xl font-light text-gray-300 max-w-2xl leading-relaxed mb-8 mx-auto md:mx-0"
            style={{ color: cmsData.globalBodyTextColor || '#d1d5db' }}
          >
            {cmsData.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <button
              onClick={() => navigate('/about')}
              className="px-8 py-3 md:py-4 bg-white text-black font-bold text-base md:text-lg rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group"
            >
              Discover More <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 md:py-4 text-white font-bold text-base md:text-lg rounded-full transition-all shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: cmsData.heroButtonColor || '#dc2626',
                boxShadow: `0 0 20px ${cmsData.heroButtonColor ? cmsData.heroButtonColor + '66' : '#dc262666'}`
              }}
            >
              {cmsData.heroButtonText || 'Join Society'}
            </button>

          </motion.div>
        </div>

        {/* 3. SOCIAL ICONS (Responsive Layout) */}
        {cmsData.socialLinks && cmsData.socialLinks.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex items-center justify-center md:justify-start gap-4 mt-10 md:mt-10 flex-wrap"
          >
            {cmsData.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 group overflow-hidden"
              >
                {/* RENDER THE IMAGE */}
                {link.iconUrl ? (
                  <img
                    src={link.iconUrl}
                    alt={link.name}
                    className="w-5 h-5 md:w-6 md:h-6 object-contain group-hover:brightness-200"
                  />
                ) : (
                  /* Fallback if no image link is provided */
                  getSocialIcon(link.name)
                )}
              </a>
            ))}
          </motion.div>
        )}

        {/* BOTTOM SECTION: Stats Bar (Responsive Grid) */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-6 left-0 right-0 px-4 md:px-20"
        >
          {cmsData.stats && (
            <div className="border-t border-white/10 pt-4 md:pt-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <AnimatedCounter value={cmsData.stats.membersConfig || 0} label="Active Members" />
                <AnimatedCounter value={cmsData.stats.projectsConfig || 0} label="Projects Launched" />
                <AnimatedCounter value={cmsData.stats.awardsConfig || 0} label="Awards Won" />
                <AnimatedCounter value={cmsData.stats.legacyConfig || 0} label="Years of Legacy" />
              </div>
            </div>
          )}
        </motion.div>

      </div>

      {/* Decorative Copyright (Minimal) */}
      <div className="absolute bottom-1 w-full text-center text-[8px] md:text-[10px] text-gray-600 z-20">
        &copy; {new Date().getFullYear()} Nalanda College Science Society. All Rights Reserved.
      </div>

    </div>
  );
};

export default Home;