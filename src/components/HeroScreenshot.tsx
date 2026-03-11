import { useEffect, useRef, useState } from "react";

export default function HeroScreenshot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0, scale: 0.88, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseRef.current.x = (e.clientX - centerX) / (rect.width / 2);
      mouseRef.current.y = (e.clientY - centerY) / (rect.height / 2);
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const viewH = window.innerHeight;
      const scrollProgress = Math.min(
        1,
        Math.max(0, (viewH - rect.top) / (viewH + rect.height * 0.3))
      );

      const targetScale = 0.88 + scrollProgress * 0.12;
      const targetOpacity = Math.min(1, scrollProgress * 1.8);
      const scrollTiltX = (1 - scrollProgress) * 6;
      const maxTilt = 1;
      const targetRotateY = mouseRef.current.x * maxTilt;
      const targetRotateX = -mouseRef.current.y * maxTilt * 0.6;

      const t = 0.08;
      currentRef.current.x = lerp(currentRef.current.x, targetRotateX + scrollTiltX, t);
      currentRef.current.y = lerp(currentRef.current.y, targetRotateY, t);
      currentRef.current.scale = lerp(currentRef.current.scale, targetScale, t);
      currentRef.current.opacity = lerp(currentRef.current.opacity, targetOpacity, t * 2);

      frame.style.transform = `perspective(1200px) rotateX(${currentRef.current.x}deg) rotateY(${currentRef.current.y}deg) scale(${currentRef.current.scale})`;
      frame.style.opacity = `${currentRef.current.opacity}`;

      rafRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isMobile) {
    return (
      <div className="flex justify-center px-4">
        <div className="relative w-[280px] sm:w-[320px]">
          {/* iPhone frame */}
          <div className="relative rounded-[3rem] border-[6px] border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Screen content */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#0a0a12]">
              <img
                src="/screenshot-mobile.gif"
                alt="Cogpit mobile interface showing live session monitoring"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </div>

          {/* Phone reflection/glow */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[70%] h-16 rounded-full blur-2xl"
            style={{ background: "radial-gradient(ellipse, oklch(0.55 0.18 264 / 0.2), transparent 70%)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
    >
      <div
        ref={frameRef}
        className="will-change-transform"
        style={{
          opacity: 0,
          transform: "perspective(1200px) rotateX(6deg) scale(0.88)",
          transformOrigin: "center bottom",
        }}
      >
        {/* Screenshot */}
        <div className="relative rounded-xl overflow-hidden">
          <img
            src="/screenshot.gif"
            alt="Cogpit dashboard showing live session monitoring, conversation timeline, and file changes panel"
            className="w-full h-auto block"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}
