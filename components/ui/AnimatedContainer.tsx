"use client";

import { ReactNode } from "react";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

export function AnimatedContainer({ 
  children, 
  className = "", 
  stagger = false 
}: AnimatedContainerProps) {
  return (
    <div className={`${className}`}>
      {stagger && Array.isArray(children) 
        ? (children as ReactNode[]).map((child, i) => (
            <div key={i} className={`fade-in-up fade-in-up-${Math.min(i + 1, 8)}`}>
              {child}
            </div>
          ))
        : <div className="fade-in-up">{children}</div>
      }
    </div>
  );
}
