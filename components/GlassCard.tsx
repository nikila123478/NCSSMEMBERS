import React from 'react';

interface GlassCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`
      relative overflow-hidden
      bg-white/5 backdrop-blur-lg 
      border border-white/10 hover:border-red-500/50
      rounded-2xl p-8 
      transition-all duration-500 ease-out
      hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]
      group
      ${className}
    `}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
        <div className="w-20 h-20 rounded-full bg-red-600 blur-3xl"></div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4 relative z-10 group-hover:text-red-400 transition-colors">
        {title}
      </h3>
      <div className="text-gray-300 leading-relaxed relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;