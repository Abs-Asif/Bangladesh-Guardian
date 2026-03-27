import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  containerRef?: React.RefObject<HTMLElement>;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ containerRef }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = containerRef
        ? containerRef.current?.scrollTop || 0
        : window.scrollY;
      setShow(scrollTop > 300);
    };

    // For refs, we need to listen on the current element.
    // If containerRef is provided, we use its current value.
    const target = containerRef ? containerRef.current : window;

    if (target) {
      target.addEventListener('scroll', handleScroll, { passive: true });
      // Initial check
      handleScroll();
    }

    return () => {
      if (target) {
        target.removeEventListener('scroll', handleScroll);
      }
    };
    // We include containerRef.current in deps to re-bind if the element changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, containerRef?.current]);

  const handleClick = () => {
    const target = containerRef ? containerRef.current : window;
    if (target) {
      target.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!show) return null;

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handleClick}
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-[100] animate-in fade-in zoom-in duration-300"
    >
      <ArrowUp className="w-6 h-6" />
    </Button>
  );
};

export default ScrollToTop;
