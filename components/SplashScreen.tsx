import React, { useEffect } from 'react';

// Enhanced 3D Animation and Rendering Styles for the "Lifted" Look
const styles = `
@keyframes ultra-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}
@keyframes explosive-lift {
  0% { transform: translateY(100px) scale(0.7); opacity: 0; filter: blur(15px); }
  100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
}
@keyframes background-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-explosive-lift { 
  animation: explosive-lift 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards; 
}
.animate-ultra-float { 
  animation: ultra-float 6s ease-in-out infinite; 
}
.animate-bg-flow { 
  background-size: 200% 200%; 
  animation: background-flow 10s ease infinite; 
}

.text-molded-3d {
  color: #FFFFFF;
  /* Deep shadow stack mimicking the card's fat neumorphic look */
  text-shadow: 
    1px 1px 0px rgba(255,255,255,0.4),
    3px 4px 6px rgba(107, 29, 54, 0.4),
    12px 16px 25px rgba(93, 21, 45, 0.5),
    -1px -1px 2px rgba(255,255,255,0.8);
}

.molded-separator {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  box-shadow: 0 6px 12px rgba(93, 21, 45, 0.4);
}
`;

const SplashScreen = ({ onComplete }: { onComplete?: () => void }) => {
  useEffect(() => {
    if (onComplete) {
      // Reduced duration to exactly 3 seconds (3000ms)
      const timer = setTimeout(onComplete, 3000); 
      return () => clearTimeout(timer);
    }
  }, [onComplete]);
  
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full overflow-hidden">
       <style>{styles}</style>
       
       {/* High-Contrast Mesh Background to emphasize 3D shadows */}
       <div className="absolute inset-0 bg-gradient-to-tr from-[#A61E4D] via-[#E84C7C] to-[#FF8BA7] animate-bg-flow"></div>
       
       {/* Directional Light Glare */}
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.2)_0%,transparent_40%)] pointer-events-none"></div>

       <div className="relative z-10 flex flex-col items-center justify-center animate-explosive-lift">
         
         {/* 3D Silhouette with Deep Molded Filter */}
         <div className="relative mb-10 animate-ultra-float">
            
            {/* Massive Ambient Depth Shadow (The "Coming out" base) */}
            <div className="absolute inset-0 rounded-full bg-[#5D152D]/30 blur-3xl scale-[1.8] translate-y-12 translate-x-4"></div>
            
            <svg 
              viewBox="0 0 195.471 195.471" 
              className="w-48 h-48 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Surface Material with subtle pearlescent sheen */}
                <linearGradient id="pearlMaterial" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#FDE2E9" />
                  <stop offset="100%" stopColor="#F5C0CE" />
                </linearGradient>

                {/* Extreme 3D Neumorphic "Coming Out of Screen" Filter */}
                <filter id="moldedFace3D" x="-100%" y="-100%" width="300%" height="300%">
                  {/* Layer 1: Tight Contact Shadow (Edge Lift) */}
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#6B1D36" floodOpacity="0.7"/>
                  
                  {/* Layer 2: Major Elevation Shadow (Fat depth) */}
                  <feDropShadow dx="15" dy="25" stdDeviation="12" floodColor="#5D152D" floodOpacity="0.5"/>
                  
                  {/* Layer 3: Long Ambient Shadow (Soft context) */}
                  <feDropShadow dx="35" dy="50" stdDeviation="25" floodColor="#4A1124" floodOpacity="0.35"/>

                  {/* Layer 4: Highlight Rim (The beveled "Fat" edge) */}
                  <feSpecularLighting surfaceScale="12" specularConstant="1.5" specularExponent="40" lightingColor="#ffffff" in="SourceAlpha" result="specOut">
                    <fePointLight x="-150" y="-150" z="300" />
                  </feSpecularLighting>
                  <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specMask"/>
                  
                  {/* Final Composition */}
                  <feComposite in="SourceGraphic" in2="specMask" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
                </filter>
              </defs>
              
              <g filter="url(#moldedFace3D)">
                <path 
                  fill="url(#pearlMaterial)" 
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
         
         {/* Molded Branding Text */}
         <div className="flex flex-col items-center">
            <h1 className="text-8xl font-serif font-black tracking-[-0.04em] text-molded-3d mb-2">
              KIMI
            </h1>
            
            {/* 3D Separator Line */}
            <div className="h-[3px] w-28 molded-separator rounded-full mb-6"></div>
            
            <p className="text-white font-bold tracking-[0.6em] text-xs uppercase opacity-90" 
               style={{ textShadow: '4px 6px 12px rgba(0,0,0,0.3)' }}>
              Self Care
            </p>
         </div>

       </div>

       {/* Subsurface Reflection Effect at Bottom */}
       <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SplashScreen;