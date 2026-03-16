import React, { useEffect, useState, useRef } from 'react';
import { TutorialStep } from '../types';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

interface TutorialOverlayProps {
  steps: TutorialStep[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  active: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  currentStepIndex,
  onNext,
  onPrev,
  onClose,
  active
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStepIndex];
  const resizeObserver = useRef<ResizeObserver | null>(null);

  const updatePosition = () => {
    if (!active || !step) return;
    
    const element = document.getElementById(step.targetId);
    if (element) {
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTargetRect(element.getBoundingClientRect());
    } else {
      // Element not found (maybe changing view), wait a bit
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (active) {
      // Initial check
      setTimeout(updatePosition, 300); // Delay for view transition

      // Setup resizing listener
      resizeObserver.current = new ResizeObserver(() => {
        updatePosition();
      });
      resizeObserver.current.observe(document.body);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      if (resizeObserver.current) resizeObserver.current.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [active, currentStepIndex, step?.targetId]);

  if (!active || !step) return null;

  // Calculate Tooltip Position
  let tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    const gap = 12;
    const isMobile = window.innerWidth < 768;
    
    // Default to center if rect is weird, otherwise calculate
    if(isMobile) {
        // Mobile: Fixed at bottom
        tooltipStyle = {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            zIndex: 60
        };
    } else {
        // Desktop: Relative to target
        switch (step.position) {
        case 'right':
            tooltipStyle = { top: targetRect.top, left: targetRect.right + gap };
            break;
        case 'left':
            tooltipStyle = { top: targetRect.top, right: window.innerWidth - targetRect.left + gap };
            break;
        case 'bottom':
            tooltipStyle = { top: targetRect.bottom + gap, left: targetRect.left };
            break;
        case 'top':
            tooltipStyle = { bottom: window.innerHeight - targetRect.top + gap, left: targetRect.left };
            break;
        default:
            tooltipStyle = { top: targetRect.bottom + gap, left: targetRect.left };
        }
        tooltipStyle.position = 'fixed';
        tooltipStyle.maxWidth = '300px';
        tooltipStyle.zIndex = 60;
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* SVG Mask for Spotlight Effect */}
      {targetRect && (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" opacity="0.7" />
              <rect 
                x={targetRect.left - 4} 
                y={targetRect.top - 4} 
                width={targetRect.width + 8} 
                height={targetRect.height + 8} 
                rx="8" 
                fill="black" 
              />
            </mask>
          </defs>
          <rect 
            x="0" 
            y="0" 
            width="100%" 
            height="100%" 
            fill="black" 
            mask="url(#spotlight-mask)" 
          />
          {/* Highlight Border */}
          <rect 
            x={targetRect.left - 4} 
            y={targetRect.top - 4} 
            width={targetRect.width + 8} 
            height={targetRect.height + 8} 
            rx="8" 
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Tooltip Box */}
      {targetRect && (
        <div 
            style={tooltipStyle} 
            className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 pointer-events-auto animate-in fade-in zoom-in duration-300"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
               <span className="bg-brand-100 text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                 {currentStepIndex + 1}
               </span>
               {step.title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            {step.content}
          </p>
          
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">
                Step {currentStepIndex + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={onPrev}
                disabled={currentStepIndex === 0}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={onNext}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-bold flex items-center gap-1"
              >
                {currentStepIndex === steps.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialOverlay;