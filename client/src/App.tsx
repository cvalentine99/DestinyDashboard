import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Game from "./pages/Game";
import Topology from "./pages/Topology";
import Crucible from "./pages/Crucible";
import BungieIntegration from "./pages/BungieIntegration";
import Triumphs from "./pages/Triumphs";
import { useEffect, useState, useRef, ReactNode } from "react";

// Page Transition Component
function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit" | "idle">("idle");
  const previousLocation = useRef(location);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayChildren(children);
      return;
    }

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
      }, 150);
      
      return () => clearTimeout(exitTimer);
    } else {
      // Same location, just update children
      setDisplayChildren(children);
    }
  }, [location, children]);

  const getTransitionStyles = (): React.CSSProperties => {
    switch (transitionStage) {
      case "exit":
        return {
          opacity: 0,
          transform: "translateY(8px) scale(0.995)",
          transition: "all 150ms ease-out",
        };
      case "enter":
        return {
          opacity: 1,
          transform: "translateY(0) scale(1)",
          transition: "all 250ms ease-out",
        };
      default:
        return {
          opacity: 1,
          transform: "translateY(0) scale(1)",
        };
    }
  };

  return (
    <div style={{ ...getTransitionStyles(), minHeight: "100vh" }}>
      {displayChildren}
    </div>
  );
}

function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/topology" component={Topology} />
        <Route path="/settings" component={Settings} />
        <Route path="/game" component={Game} />
        <Route path="/crucible" component={Crucible} />
        <Route path="/bungie" component={BungieIntegration} />
        <Route path="/triumphs" component={Triumphs} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
