import React from 'react';
import Lottie from 'lottie-react';

const RocketAnimation: React.FC = () => {
  // Using a reliable public Lottie JSON URL for a rocket/space animation
  // Source: LottieFiles (Rocket in Space)
  const animationUrl = "https://assets9.lottiefiles.com/packages/lf20_96bovgkq.json";
  
  const [animationData, setAnimationData] = React.useState<any>(null);
  const [error, setError] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch(animationUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => {
        console.error("Error loading animation:", err);
        setError(true);
      });
  }, []);

  if (error) {
    // Fallback UI if the animation fails to load
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl animate-pulse"></div>
            <div className="z-10 w-48 h-48 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <span className="text-red-500 font-bold tracking-widest">ROCKET SYSTEM</span>
            </div>
        </div>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse w-32 h-32 rounded-full bg-red-500/20 blur-xl"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-10 drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
};

export default RocketAnimation;