import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import heroAnimationUrl from '../../assets/HERO-200px.json?url';

export default function EvaHeroAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: heroAnimationUrl,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
    });

    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="eva-landing-hero-symbol eva-landing-hero-animation"
      aria-hidden="true"
    />
  );
}
