import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit" | "idle">("idle");
  const previousLocation = useRef(location);

  useEffect(() => {
    if (location !== previousLocation.current) {
      // Start exit animation
      setTransitionStage("exit");
      
      // After exit animation, update children and start enter animation
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("enter");
        previousLocation.current = location;
        
        // Reset to idle after enter animation
        const enterTimer = setTimeout(() => {
          setTransitionStage("idle");
        }, 300);
        
        return () => clearTimeout(enterTimer);
      }, 200);
      
      return () => clearTimeout(exitTimer);
    } else {
      // Initial render or same location
      setDisplayChildren(children);
    }
  }, [location, children]);

  const getTransitionClasses = () => {
    switch (transitionStage) {
      case "exit":
        return "opacity-0 translate-y-2 scale-[0.99]";
      case "enter":
        return "opacity-100 translate-y-0 scale-100";
      default:
        return "opacity-100 translate-y-0 scale-100";
    }
  };

  return (
    <div
      className={`transition-all duration-200 ease-out ${getTransitionClasses()}`}
      style={{ minHeight: "100vh" }}
    >
      {displayChildren}
    </div>
  );
}
