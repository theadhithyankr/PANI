import React, { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

const Confetti = ({ duration = 5000 }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Hide confetti after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.2}
        initialVelocityY={20}
        colors={['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#818CF8']}
      />
    </div>
  );
};

export default Confetti; 