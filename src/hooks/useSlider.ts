'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseSliderProps {
  itemCount: number;
  autoSlideInterval?: number;
  autoPlay?: boolean;
  interval?: number;
}

export const useSlider = ({
  itemCount,
  autoSlideInterval = 6000,
  autoPlay = true,
  interval = 5000
}: UseSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    // Don't autoplay if user has interacted with navigation
    if (itemCount <= 1 || !autoPlay || userInteracted) return;

    const slideInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % itemCount);
        setFade(true);
      }, 300);
    }, interval || autoSlideInterval);

    return () => clearInterval(slideInterval);
  }, [itemCount, autoSlideInterval, autoPlay, interval, userInteracted]);

  const nextSlide = useCallback(() => {
    setUserInteracted(true);
    setCurrentSlide((prev) => (prev + 1) % itemCount);
  }, [itemCount]);

  const prevSlide = useCallback(() => {
    setUserInteracted(true);
    setCurrentSlide((prev) => (prev - 1 + itemCount) % itemCount);
  }, [itemCount]);

  const goToSlide = useCallback((index: number) => {
    setUserInteracted(true);
    if (index >= 0 && index < itemCount) {
      setCurrentSlide(index);
    }
  }, [itemCount]);

  return {
    currentSlide,
    fade,
    nextSlide,
    prevSlide,
    goToSlide,
  };
}; 