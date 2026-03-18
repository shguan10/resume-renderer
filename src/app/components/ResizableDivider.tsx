import React, { useCallback, useRef, useEffect, useState } from 'react';

interface ResizableDividerProps {
  /** Current left panel fraction (0-1) */
  fraction: number;
  /** Called with new fraction */
  onFractionChange: (fraction: number) => void;
  /** Min fraction for left panel */
  min?: number;
  /** Max fraction for left panel */
  max?: number;
}

export function ResizableDivider({
  fraction,
  onFractionChange,
  min = 0.2,
  max = 0.8,
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newFraction = Math.min(max, Math.max(min, x / rect.width));
      onFractionChange(newFraction);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onFractionChange, min, max]);

  return (
    <div
      ref={containerRef}
      className="md-editor-divider"
      data-dragging={isDragging || undefined}
      onMouseDown={handleMouseDown}
    >
      <div className="md-editor-divider-handle" />
    </div>
  );
}
