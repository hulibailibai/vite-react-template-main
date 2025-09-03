import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface NumberFlipProps {
  value: number;
  className?: string;
  duration?: number;
}

interface DigitFlipProps {
  digit: number;
  className?: string;
  duration?: number;
}

const DigitFlip: React.FC<DigitFlipProps> = ({ digit, className, duration = 600 }) => {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const [nextDigit, setNextDigit] = useState(digit);

  useEffect(() => {
    if (digit !== currentDigit) {
      // 如果数字差距大于1，需要逐步递增
      const diff = digit - currentDigit;
      if (Math.abs(diff) > 1) {
        let step = currentDigit;
        const increment = diff > 0 ? 1 : -1;
        const stepDuration = duration / Math.abs(diff);
        
        const animateStep = () => {
          if (step !== digit) {
            step += increment;
            setNextDigit(step);
            setIsFlipping(true);
            
            setTimeout(() => {
              setCurrentDigit(step);
              setIsFlipping(false);
              
              if (step !== digit) {
                setTimeout(animateStep, stepDuration * 0.2); // 短暂停顿后继续
              }
            }, stepDuration * 0.8);
          }
        };
        
        animateStep();
      } else {
        // 单步变化，直接动画
        setNextDigit(digit);
        setIsFlipping(true);
        
        const timer = setTimeout(() => {
          setCurrentDigit(digit);
          setIsFlipping(false);
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [digit, currentDigit, duration]);

  return (
    <div className={clsx('relative inline-block overflow-hidden h-full', className)}>
      <div 
        className={clsx(
          'transition-transform ease-out',
          isFlipping ? 'transform -translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
        )}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {currentDigit}
      </div>
      {isFlipping && (
        <div 
          className="absolute top-full left-0 w-full transition-transform ease-out transform -translate-y-full"
          style={{ transitionDuration: `${duration}ms` }}
        >
          {nextDigit}
        </div>
      )}
    </div>
  );
};

export const NumberFlip: React.FC<NumberFlipProps> = ({ 
  value, 
  className, 
  duration = 600 
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const numberString = formatNumber(value);
  const digits = numberString.split('');

  return (
    <div className={clsx('inline-flex', className)}>
      {digits.map((char, index) => {
        if (char === ',') {
          return (
            <span key={`comma-${index}`} className="mx-1">
              ,
            </span>
          );
        }
        
        const digit = parseInt(char);
        if (isNaN(digit)) {
          return (
            <span key={`char-${index}`}>
              {char}
            </span>
          );
        }

        return (
          <DigitFlip
            key={`digit-${index}`}
            digit={digit}
            className="w-8 text-center flex items-center justify-center"
            duration={duration}
          />
        );
      })}
    </div>
  );
};

export default NumberFlip;