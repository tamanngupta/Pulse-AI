import React from "react";
import { Task } from "../types";

interface AtmosphereProps {
  timeOfDay: "morning" | "day" | "night";
  variant?: "fullscreen" | "header";
  tasks?: Task[];
}

export default function Atmosphere({ timeOfDay, variant = "fullscreen", tasks = [] }: AtmosphereProps) {
  const isHeader = variant === "header";
  const svgHeight = isHeader ? 200 : 450;

  // Calculate overall task progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0.15; // default nice crescent if empty

  // Filter tasks into priority layers
  const backgroundTasks = tasks.filter((t) => t.priority === "low");
  const midgroundTasks = tasks.filter((t) => t.priority === "medium");
  const foregroundTasks = tasks.filter((t) => t.priority === "high");

  // Helper to draw a single smooth bell-shaped peak
  const getPeakPath = (x: number, height: number, width: number) => {
    const left = x - width / 2;
    const right = x + width / 2;
    const peakY = svgHeight - height;
    return `M ${left},${svgHeight} C ${left + width / 4},${svgHeight} ${x - width / 8},${peakY} ${x},${peakY} C ${x + width / 8},${peakY} ${right - width / 4},${svgHeight} ${right},${svgHeight} Z`;
  };

  // Generate background mountain shapes (Low priority)
  const renderBackgroundLayer = () => {
    const color = timeOfDay === "morning" ? "#131224" : timeOfDay === "day" ? "#111624" : "#090A14";
    const opacity = 0.45;

    if (backgroundTasks.length === 0) {
      // Default aesthetic peaks
      return (
        <g fill={color} opacity={opacity}>
          <path d={getPeakPath(200, svgHeight * 0.22, 450)} />
          <path d={getPeakPath(550, svgHeight * 0.28, 500)} />
          <path d={getPeakPath(850, svgHeight * 0.24, 400)} />
        </g>
      );
    }

    const spacing = 1000 / (backgroundTasks.length + 1);
    return (
      <g fill={color} opacity={opacity}>
        {backgroundTasks.map((task, i) => {
          const charCode = task.title.charCodeAt(0) || 0;
          const xOffset = (charCode % 40) - 20;
          const x = spacing * (i + 1) + xOffset;
          const duration = task.estimatedDuration || 30;
          const height = Math.min(svgHeight * 0.35, Math.max(svgHeight * 0.12, (duration / 120) * (svgHeight * 0.15) + (svgHeight * 0.1)));
          const width = 350 + (duration % 5) * 30;
          return <path key={task.id} d={getPeakPath(x, height, width)} />;
        })}
      </g>
    );
  };

  // Generate mid-ground mountain shapes (Medium priority)
  const renderMidgroundLayer = () => {
    const color = timeOfDay === "morning" ? "#1B1932" : timeOfDay === "day" ? "#182033" : "#101124";
    const opacity = 0.75;

    if (midgroundTasks.length === 0) {
      // Default aesthetic peaks
      return (
        <g fill={color} opacity={opacity}>
          <path d={getPeakPath(350, svgHeight * 0.38, 550)} />
          <path d={getPeakPath(700, svgHeight * 0.44, 600)} />
        </g>
      );
    }

    const spacing = 1000 / (midgroundTasks.length + 1);
    return (
      <g fill={color} opacity={opacity}>
        {midgroundTasks.map((task, i) => {
          const charCode = task.title.charCodeAt(0) || 0;
          const xOffset = (charCode % 50) - 25;
          const x = spacing * (i + 1) + xOffset;
          const duration = task.estimatedDuration || 45;
          const height = Math.min(svgHeight * 0.55, Math.max(svgHeight * 0.22, (duration / 120) * (svgHeight * 0.2) + (svgHeight * 0.18)));
          const width = 450 + (duration % 7) * 35;
          return <path key={task.id} d={getPeakPath(x, height, width)} />;
        })}
      </g>
    );
  };

  // Generate foreground mountain shapes (High priority)
  const renderForegroundLayer = () => {
    const color = timeOfDay === "morning" ? "#262140" : timeOfDay === "day" ? "#222E47" : "#181933";
    const opacity = 1.0;

    if (foregroundTasks.length === 0) {
      // Default aesthetic peaks
      return (
        <g fill={color} opacity={opacity}>
          <path d={getPeakPath(150, svgHeight * 0.55, 650)} />
          <path d={getPeakPath(800, svgHeight * 0.65, 700)} />
        </g>
      );
    }

    const spacing = 1000 / (foregroundTasks.length + 1);
    return (
      <g fill={color} opacity={opacity} stroke="rgba(255,255,255,0.025)" strokeWidth="1">
        {foregroundTasks.map((task, i) => {
          const charCode = task.title.charCodeAt(0) || 0;
          const xOffset = (charCode % 60) - 30;
          // Position urgent tasks more to the right, low-urgency to the left
          const urgencyWeight = task.deadline ? 150 : 0;
          const x = spacing * (i + 1) + xOffset + urgencyWeight;
          const duration = task.estimatedDuration || 60;
          const height = Math.min(svgHeight * 0.78, Math.max(svgHeight * 0.35, (duration / 120) * (svgHeight * 0.25) + (svgHeight * 0.32)));
          const width = 500 + (duration % 9) * 40;
          return <path key={task.id} d={getPeakPath(x, height, width)} />;
        })}
      </g>
    );
  };

  // Render sky gradient styles based on state
  const getSkyStyles = () => {
    switch (timeOfDay) {
      case "morning":
        return {
          from: "#1D1C35",
          via: "#2D2338",
          to: "#402C36",
        };
      case "day":
        return {
          from: "#1C243A",
          via: "#25314C",
          to: "#2F3D5B",
        };
      case "night":
      default:
        return {
          from: "#050611",
          via: "#0D0F24",
          to: "#131633",
        };
    }
  };

  const skyColors = getSkyStyles();

  // Render Moon or Sun based on state
  const renderCelestialBody = () => {
    if (timeOfDay === "day") {
      // High, glowing silver sun whose height increases with completion ratio
      const sunX = 850;
      const sunY = isHeader ? 60 - (30 * completionRatio) : 160 - (80 * completionRatio);
      return (
        <g>
          {/* Outer Sun Glow */}
          <circle cx={sunX} cy={sunY} r={isHeader ? 32 : 55} fill="url(#sun-glow)" opacity="0.12" />
          <circle cx={sunX} cy={sunY} r={isHeader ? 22 : 38} fill="url(#sun-glow-inner)" opacity="0.25" />
          {/* Main Sun Body */}
          <circle cx={sunX} cy={sunY} r={isHeader ? 12 : 18} fill="#F5F4EE" />
          <defs>
            <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5F4EE" />
              <stop offset="100%" stopColor="#F5F4EE" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sun-glow-inner" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5F4EE" />
              <stop offset="100%" stopColor="#F5F4EE" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
    } else if (timeOfDay === "morning") {
      // Warm rising horizon light at bottom right, gets brighter as tasks complete
      const horizonGlowOpacity = 0.12 + 0.25 * completionRatio;
      return (
        <g>
          <circle cx="950" cy={svgHeight} r={isHeader ? 120 : 220} fill="url(#morning-horizon-glow)" opacity={horizonGlowOpacity} />
          <defs>
            <radialGradient id="morning-horizon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE0B2" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#FFB74D" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#402C36" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
    } else {
      // Night Moon: Crescent-to-Full reflection based on completionRatio
      const moonX = 880;
      const moonY = isHeader ? 60 : 120;
      const moonR = isHeader ? 16 : 28;
      
      // Interpolate shadow circle X position to block/unblock the moon
      // completionRatio: 0 -> crescent (shadow overlaps moon), 1 -> full (shadow moves completely left/away)
      const shadowX = moonX - (moonR * 2.3) + (moonR * 1.9 * (1 - completionRatio));

      return (
        <g>
          {/* Outer glow surrounding the moon */}
          <circle cx={moonX} cy={moonY} r={moonR * 2.2} fill="url(#moon-glow)" opacity="0.08" />
          <circle cx={moonX} cy={moonY} r={moonR * 1.5} fill="url(#moon-glow)" opacity="0.15" />
          
          {/* Masked Moon (clipPath subtraction shadow) */}
          <g clipPath="url(#moon-clip)">
            <circle cx={moonX} cy={moonY} r={moonR} fill="#F5F4EE" />
          </g>

          {/* Mask implementation */}
          <defs>
            <clipPath id="moon-clip">
              <path d={`M ${moonX - moonR * 2},${moonY - moonR * 2} H ${moonX + moonR * 2} V ${moonY + moonR * 2} H ${moonX - moonR * 2} Z`} />
              {/* Subtracting shadow circle */}
              <circle cx={shadowX} cy={moonY} r={moonR} fill="#000000" />
            </clipPath>
            <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5F4EE" />
              <stop offset="100%" stopColor="#F5F4EE" stopOpacity="0" />
            </radialGradient>
          </defs>
        </g>
      );
    }
  };

  // Dense glowing star-dots at night
  const renderStars = () => {
    if (timeOfDay !== "night") return null;
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
        {/* Deliberate constellation lines */}
        <line x1="80" y1="60" x2="120" y2="50" stroke="#F5F4EE" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="120" y1="50" x2="140" y2="85" stroke="#F5F4EE" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="140" y1="85" x2="110" y2="105" stroke="#F5F4EE" strokeWidth="0.5" strokeOpacity="0.1" />
        <line x1="110" y1="105" x2="80" y2="60" stroke="#F5F4EE" strokeWidth="0.5" strokeOpacity="0.1" />
        
        {/* Twinkling star circles */}
        <circle cx="80" cy="60" r="1.5" fill="#F5F4EE" className="animate-pulse" />
        <circle cx="120" cy="50" r="1" fill="#F5F4EE" />
        <circle cx="140" cy="85" r="1.8" fill="#F5F4EE" className="animate-pulse" />
        <circle cx="110" cy="105" r="1.2" fill="#F5F4EE" />
        <circle cx="280" cy="120" r="1.5" fill="#F5F4EE" />
        <circle cx="420" cy="50" r="1" fill="#F5F4EE" opacity="0.6" />
        <circle cx="590" cy="95" r="2" fill="#F5F4EE" className="animate-pulse" />
        <circle cx="710" cy="160" r="1.2" fill="#F5F4EE" />
        <circle cx="940" cy="45" r="1.5" fill="#F5F4EE" opacity="0.8" />
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Sky Gradient */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `linear-gradient(to bottom, ${skyColors.from}, ${skyColors.via}, ${skyColors.to})`
        }}
      />

      {/* Stars on top of sky background */}
      {renderStars()}

      {/* Dynamic Painterly SVG Art */}
      <svg
        width="100%"
        height={svgHeight}
        viewBox="0 0 1000 450"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full"
      >
        {/* 1. Celestial body layer (Moon/Sun) */}
        {renderCelestialBody()}

        {/* 2. Background mountain peaks (Low Priority) */}
        {renderBackgroundLayer()}

        {/* 3. Midground mountain peaks (Medium Priority) */}
        {renderMidgroundLayer()}

        {/* 4. Foreground mountain peaks (High Priority) */}
        {renderForegroundLayer()}
      </svg>
    </div>
  );
}
