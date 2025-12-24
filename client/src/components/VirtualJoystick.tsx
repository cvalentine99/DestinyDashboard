import { useEffect, useRef, useState, useCallback } from "react";

interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void;
  onFire: (firing: boolean) => void;
  onAbility: () => void;
  onSuper: () => void;
  onWeaponSwitch: (weapon: number) => void;
  disabled?: boolean;
  abilityCooldownPercent: number;
  superMeterPercent: number;
  currentWeapon: number;
  heavyAmmo: number;
}

export default function VirtualJoystick({
  onMove,
  onFire,
  onAbility,
  onSuper,
  onWeaponSwitch,
  disabled = false,
  abilityCooldownPercent,
  superMeterPercent,
  currentWeapon,
  heavyAmmo,
}: VirtualJoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [firing, setFiring] = useState(false);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
      );
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Joystick touch handling
  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setJoystickActive(true);
    
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickOrigin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }, [disabled]);

  const handleJoystickMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive || disabled) return;
    e.preventDefault();

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - joystickOrigin.current.x;
    const dy = clientY - joystickOrigin.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);

    // Update knob position
    if (knobRef.current) {
      const knobX = Math.cos(angle) * clampedDistance;
      const knobY = Math.sin(angle) * clampedDistance;
      knobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    // Normalize movement (-1 to 1)
    const normalizedX = (Math.cos(angle) * clampedDistance) / maxDistance;
    const normalizedY = (Math.sin(angle) * clampedDistance) / maxDistance;
    onMove(normalizedX, normalizedY);
  }, [joystickActive, disabled, onMove]);

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    if (knobRef.current) {
      knobRef.current.style.transform = "translate(0, 0)";
    }
    onMove(0, 0);
  }, [onMove]);

  // Fire button handling
  const handleFireStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setFiring(true);
    onFire(true);
  }, [disabled, onFire]);

  const handleFireEnd = useCallback(() => {
    setFiring(false);
    onFire(false);
  }, [onFire]);

  // Continuous firing while button held
  useEffect(() => {
    if (firing && !disabled) {
      const fireLoop = () => {
        onFire(true);
        animationRef.current = requestAnimationFrame(fireLoop);
      };
      animationRef.current = requestAnimationFrame(fireLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [firing, disabled, onFire]);

  // Don't render on non-touch devices
  if (!isTouchDevice) return null;

  const weaponColors = ["#4ADE80", "#FBBF24", "#60A5FA", "#FF6B35"];
  const weaponNames = ["AR", "HC", "PR", "RL"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ touchAction: "none" }}>
      {/* Left side - Movement Joystick */}
      <div
        ref={joystickRef}
        className="absolute bottom-24 left-8 w-32 h-32 rounded-full pointer-events-auto"
        style={{
          background: "radial-gradient(circle, rgba(45,212,191,0.3) 0%, rgba(45,212,191,0.1) 70%, transparent 100%)",
          border: "2px solid rgba(45,212,191,0.5)",
          boxShadow: "0 0 20px rgba(45,212,191,0.3)",
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={handleJoystickMove}
        onMouseUp={handleJoystickEnd}
        onMouseLeave={handleJoystickEnd}
      >
        {/* Joystick knob */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 w-14 h-14 -mt-7 -ml-7 rounded-full transition-transform duration-75"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.8) 0%, rgba(45,212,191,0.4) 100%)",
            border: "2px solid rgba(45,212,191,0.9)",
            boxShadow: joystickActive ? "0 0 30px rgba(45,212,191,0.8)" : "0 0 15px rgba(45,212,191,0.5)",
          }}
        />
        {/* Direction indicators */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-teal-400/50 text-xs">▲</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-teal-400/50 text-xs">▼</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-teal-400/50 text-xs">◀</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400/50 text-xs">▶</div>
      </div>

      {/* Right side - Fire Button */}
      <div
        className="absolute bottom-24 right-8 w-24 h-24 rounded-full pointer-events-auto flex items-center justify-center"
        style={{
          background: firing
            ? "radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(251,191,36,0.4) 100%)"
            : "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.2) 100%)",
          border: "3px solid rgba(251,191,36,0.7)",
          boxShadow: firing ? "0 0 40px rgba(251,191,36,0.8)" : "0 0 20px rgba(251,191,36,0.4)",
        }}
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        onMouseDown={handleFireStart}
        onMouseUp={handleFireEnd}
        onMouseLeave={handleFireEnd}
      >
        <span className="text-amber-300 font-bold text-lg tracking-wider">FIRE</span>
      </div>

      {/* Ability Button (above fire) */}
      <div
        className="absolute bottom-52 right-10 w-16 h-16 rounded-full pointer-events-auto flex items-center justify-center relative"
        style={{
          background: abilityCooldownPercent >= 100
            ? "radial-gradient(circle, rgba(45,212,191,0.6) 0%, rgba(45,212,191,0.3) 100%)"
            : "radial-gradient(circle, rgba(100,100,100,0.4) 0%, rgba(100,100,100,0.2) 100%)",
          border: `2px solid ${abilityCooldownPercent >= 100 ? "rgba(45,212,191,0.8)" : "rgba(100,100,100,0.5)"}`,
        }}
        onTouchStart={(e) => { e.preventDefault(); if (abilityCooldownPercent >= 100) onAbility(); }}
        onMouseDown={() => { if (abilityCooldownPercent >= 100) onAbility(); }}
      >
        {/* Cooldown overlay */}
        {abilityCooldownPercent < 100 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(transparent ${abilityCooldownPercent}%, rgba(0,0,0,0.6) ${abilityCooldownPercent}%)`,
            }}
          />
        )}
        <span className="text-teal-300 font-bold text-xs z-10">ABILITY</span>
      </div>

      {/* Super Button (above ability) */}
      <div
        className="absolute bottom-72 right-12 w-14 h-14 rounded-full pointer-events-auto flex items-center justify-center relative"
        style={{
          background: superMeterPercent >= 100
            ? "radial-gradient(circle, rgba(168,85,247,0.8) 0%, rgba(168,85,247,0.4) 100%)"
            : "radial-gradient(circle, rgba(100,100,100,0.4) 0%, rgba(100,100,100,0.2) 100%)",
          border: `2px solid ${superMeterPercent >= 100 ? "rgba(168,85,247,0.9)" : "rgba(100,100,100,0.5)"}`,
          boxShadow: superMeterPercent >= 100 ? "0 0 30px rgba(168,85,247,0.6)" : "none",
        }}
        onTouchStart={(e) => { e.preventDefault(); if (superMeterPercent >= 100) onSuper(); }}
        onMouseDown={() => { if (superMeterPercent >= 100) onSuper(); }}
      >
        {/* Super meter fill */}
        {superMeterPercent < 100 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(rgba(168,85,247,0.5) ${superMeterPercent}%, transparent ${superMeterPercent}%)`,
            }}
          />
        )}
        <span className="text-purple-300 font-bold text-xs z-10">⚡</span>
      </div>

      {/* Weapon Selection (bottom center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
        {weaponNames.map((name, index) => {
          const isRocket = index === 3;
          const isDisabled = isRocket && heavyAmmo <= 0;
          const isSelected = currentWeapon === index;
          
          return (
            <div
              key={name}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${isDisabled ? "opacity-40" : ""}`}
              style={{
                background: isSelected
                  ? `radial-gradient(circle, ${weaponColors[index]}40 0%, ${weaponColors[index]}20 100%)`
                  : "rgba(30,30,30,0.8)",
                border: `2px solid ${isSelected ? weaponColors[index] : "rgba(100,100,100,0.5)"}`,
                boxShadow: isSelected ? `0 0 15px ${weaponColors[index]}60` : "none",
              }}
              onTouchStart={(e) => { e.preventDefault(); if (!isDisabled) onWeaponSwitch(index); }}
              onMouseDown={() => { if (!isDisabled) onWeaponSwitch(index); }}
            >
              <span className="text-xs font-bold" style={{ color: weaponColors[index] }}>{name}</span>
              {isRocket && (
                <span className="text-[10px] text-gray-400">{heavyAmmo}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Touch hint overlay (shown briefly) */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <p className="text-xl font-bold mb-2">Touch Controls</p>
            <p className="text-sm opacity-70">Left: Move | Right: Fire</p>
          </div>
        </div>
      )}
    </div>
  );
}
