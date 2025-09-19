import React from 'react';

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const RainbowButton = ({ children, className = "", ...props }: RainbowButtonProps) => {
  return (
    <>
      <button 
        className={`rainbow-border relative w-full h-12 flex items-center justify-center gap-2.5 px-4 bg-black rounded-xl border-none text-white cursor-pointer font-black transition-all duration-200 ${className}`}
        {...props}
      >
        {children}
      </button>
      
      <style jsx>{`
        .rainbow-border::before,
        .rainbow-border::after {
          content: '';
          position: absolute;
          left: -2px;
          top: -2px;
          border-radius: 12px;
          background: linear-gradient(45deg, #fbbf24, #f59e0b, #facc15, #3b82f6, #2563eb, #fbbf24, #f59e0b, #facc15, #3b82f6, #2563eb);
          background-size: 400%;
          width: calc(100% + 4px);
          height: calc(100% + 4px);
          z-index: -1;
          animation: rainbow 60s linear infinite;
          opacity: 0.7;
        }
        .rainbow-border::after {
          filter: blur(20px);
          opacity: 0.4;
        }
        @keyframes rainbow {
          0% { background-position: 0 0; }
          50% { background-position: 400% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </>
  );
};