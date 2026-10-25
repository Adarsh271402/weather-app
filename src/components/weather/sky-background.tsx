"use client";

interface SkyBackgroundProps {
  /** visual cloud density derived from the current weather */
  density: "light" | "medium" | "heavy";
  isDay: boolean;
}

const CLOUDS = [
  { top: "6%", width: 340, height: 110, duration: "65s", delay: "-12s", left: "-10%" },
  { top: "16%", width: 260, height: 90, duration: "80s", delay: "-40s", left: "30%" },
  { top: "2%", width: 420, height: 130, duration: "95s", delay: "-70s", left: "60%" },
  { top: "34%", width: 300, height: 100, duration: "75s", delay: "-25s", left: "15%" },
  { top: "52%", width: 360, height: 120, duration: "105s", delay: "-55s", left: "55%" },
  { top: "70%", width: 280, height: 95, duration: "88s", delay: "-8s", left: "5%" },
] as const;

const STARS = [
  { top: "8%", left: "12%" },
  { top: "15%", left: "42%" },
  { top: "6%", left: "68%" },
  { top: "22%", left: "85%" },
  { top: "30%", left: "24%" },
  { top: "12%", left: "92%" },
  { top: "40%", left: "8%" },
  { top: "26%", left: "58%" },
  { top: "48%", left: "74%" },
  { top: "36%", left: "38%" },
] as const;

export function SkyBackground({ density, isDay }: SkyBackgroundProps) {
  const opacity = density === "light" ? 0.25 : density === "medium" ? 0.45 : 0.7;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* sun glow for clear days */}
      {isDay && density === "light" && (
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-amber-200/40 blur-3xl" />
      )}
      {/* moon glow for clear nights */}
      {!isDay && (
        <div className="absolute top-10 right-[12%] h-28 w-28 rounded-full bg-slate-100/90 blur-[2px] shadow-[0_0_120px_60px_rgba(226,232,240,0.25)]" />
      )}

      {/* twinkling stars at night */}
      {!isDay &&
        STARS.map((s, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white animate-twinkle"
            style={{ top: s.top, left: s.left, animationDelay: `${i * 0.7}s` }}
          />
        ))}

      {/* drifting clouds */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute animate-drift"
          style={{
            top: c.top,
            left: c.left,
            width: c.width,
            height: c.height,
            animationDuration: c.duration,
            animationDelay: c.delay,
          }}
        >
          <div
            className="h-full w-full rounded-full bg-white blur-2xl"
            style={{ opacity }}
          />
        </div>
      ))}
    </div>
  );
}
