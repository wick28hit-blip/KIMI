import React, { useEffect } from 'react';

// Animation Keyframes and Styles
const styles = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}
@keyframes slide-up-fade {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes gradient-xy {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes heartbeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.15); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  70% { transform: scale(1); }
}
@keyframes ripple {
  0% { transform: scale(1); opacity: 0.6; border-width: 4px; }
  100% { transform: scale(3); opacity: 0; border-width: 0px; }
}
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-slide-up { animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-gradient-xy { background-size: 200% 200%; animation: gradient-xy 8s ease infinite; }
.animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
.animate-ripple { animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
.text-glow {
  text-shadow: 0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0,0,0,0.1);
}
`;

const SplashScreen = ({ onComplete }: { onComplete?: () => void }) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 4500); // 4.5 seconds duration
      return () => clearTimeout(timer);
    }
  }, [onComplete]);
  
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-rose-50">
       <style>{styles}</style>
       
       {/* Dynamic Background with Mesh Gradient */}
       <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 animate-gradient-xy opacity-90"></div>
       
       {/* Soft Overlay */}
       <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>

       {/* Floating Bokeh Particles */}
       {[...Array(6)].map((_, i) => (
         <div key={i} 
              className="absolute bg-white/20 rounded-full animate-float blur-md"
              style={{
                width: Math.random() * 60 + 20 + 'px',
                height: Math.random() * 60 + 20 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDuration: Math.random() * 5 + 5 + 's',
                animationDelay: Math.random() * 2 + 's'
              }} 
         />
       ))}

       <div className="relative z-10 flex flex-col items-center justify-center">
         {/* The Heart Splash Assembly */}
         <div className="relative mb-10">
            {/* Ripple Effects */}
            <div className="absolute inset-0 -m-1 rounded-full border border-white/40 animate-ripple" style={{animationDelay: '0s'}}></div>
            <div className="absolute inset-0 -m-1 rounded-full border border-white/30 animate-ripple" style={{animationDelay: '0.6s'}}></div>
            <div className="absolute inset-0 -m-1 rounded-full border border-white/20 animate-ripple" style={{animationDelay: '1.2s'}}></div>
            
            {/* Central Icon */}
            <div className="relative bg-white/20 backdrop-blur-md p-8 rounded-full shadow-2xl border border-white/40 animate-heartbeat flex items-center justify-center">
               <svg 
                 viewBox="0 0 195.471 195.471" 
                 className="w-24 h-24 drop-shadow-lg"
                 style={{ filter: "drop-shadow(0px 10px 10px rgba(0,0,0,0.2))" }}
               >
                 <defs>
                   <linearGradient id="womanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#ffffff" />
                     <stop offset="100%" stopColor="#fce7f3" />
                   </linearGradient>
                 </defs>
                 
                 {/* Side View Woman Silhouette */}
                 <g>
                    <path 
                      fill="url(#womanGradient)" 
                      d="M103.832,79.077c-9.475-8.813-20.172-21.992-20.557-41.768c4.784,16.109,21.146,39.05,65.134,69.122
                      c0,0-48.292-67.609-31.95-105.508c0,0-9.018-4.646-27.021,6.908c0.012-0.028,0.021-0.063,0.033-0.096
                      c0,0-30.027,20.121-25.012,42.099c0.985,4.342,0.296,9.593-10.153,14.62c-2.096,1-5.822,2.223-4.83,7.923
                      c0,0,1.013,4.057,3.037,5.608c0.1,0.077,0.217,0.123,0.308,0.213c2.601,2.477-1.916,1.771-3.338,2.225
                      c-2.421,0.777-2.48,5.573,1.359,9.784c0,0-6.192,6.194-2.723,11.645c0,0,0.862,0.983,4.461,0.492c0,0-2.769,19.545,12.259,19.069
                      c8.843-0.29,28.113-7.557,35.166,3.842c0,0,23.902,29.352-5.075,70.216c0,0,33.426-12.378,36.895-50.287
                      C131.819,145.2,142.474,114.983,103.832,79.077z"
                    />
                 </g>
               </svg>
            </div>
         </div>
         
         {/* Text Typography */}
         <h1 className="text-7xl font-serif font-black tracking-tighter text-white animate-slide-up mb-3 text-glow">KIMI</h1>
         
         {/* Decorative Line */}
         <div className="h-1 w-16 bg-white/70 rounded-full mb-4 animate-slide-up shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{animationDelay: '0.1s'}}></div>
         
         <p className="text-white font-bold tracking-[0.4em] text-xs uppercase opacity-90 animate-slide-up drop-shadow-md" style={{animationDelay: '0.2s'}}>Self Care</p>
       </div>
    </div>
  );
};

export default SplashScreen;