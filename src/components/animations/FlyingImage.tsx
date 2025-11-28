import { useEffect, useState } from "react";

interface FlyingImageProps {
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onComplete?: () => void;
}

export default function FlyingImage({
  imageUrl,
  startX,
  startY,
  endX,
  endY,
  onComplete,
}: FlyingImageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-[99999]"
      style={{
        left: `${startX}px`,
        top: `${startY}px`,
        animation: `fly-to-cart 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
        "--end-x": `${endX - startX}px`,
        "--end-y": `${endY - startY}px`,
      } as React.CSSProperties}
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-xl shadow-2xl ring-4 ring-blue-500/50">
        <img
          src={imageUrl}
          alt="Flying dress"
          className="h-full w-full object-cover"
        />
        {/* Sparkle effect */}
        <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
      </div>

      <style>{`
        @keyframes fly-to-cart {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5 - 30px)) scale(0.8) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.2) rotate(10deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
