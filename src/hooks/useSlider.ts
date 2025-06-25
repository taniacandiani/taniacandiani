'use client';

import { useState, useEffect } from 'react';

interface UseSliderProps {
  itemCount: number;
  autoSlideInterval?: number;
}

export const useSlider = ({ itemCount, autoSlideInterval = 6000 }: UseSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (itemCount <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % itemCount);
        setFade(true);
      }, 300);
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [itemCount, autoSlideInterval]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % itemCount);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + itemCount) % itemCount);
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < itemCount) {
      setCurrentSlide(index);
    }
  };

  return {
    currentSlide,
    fade,
    nextSlide,
    prevSlide,
    goToSlide,
  };
}; 