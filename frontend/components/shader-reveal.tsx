"use client";

interface ShaderRevealProps {
  frontImage: string;
  backImage: string;
  mouseForce?: number;
  cursorSize?: number;
  resolution?: number;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  revealStrength?: number;
  revealSoftness?: number;
  className?: string;
}

export default function ShaderReveal({ frontImage, className }: ShaderRevealProps) {
  return (
    <div className={className} style={{ backgroundImage: `url(${frontImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
  );
}
