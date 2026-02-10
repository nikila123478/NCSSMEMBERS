import React from 'react';

interface GenericPageProps {
  title: string;
  subtitle: string;
}

const GenericPage: React.FC<GenericPageProps> = ({ title, subtitle }) => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 relative bg-black">
       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black -z-20"></div>
       <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            {title}<span className="text-red-500">.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mb-12">
            {subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Placeholder Content Blocks */}
             {[1, 2, 3, 4, 5, 6].map((item) => (
               <div key={item} className="bg-white/5 border border-white/10 rounded-xl h-64 p-6 hover:bg-white/10 transition-colors animate-pulse">
                  <div className="w-full h-32 bg-white/5 rounded-lg mb-4"></div>
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-white/10 rounded"></div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default GenericPage;