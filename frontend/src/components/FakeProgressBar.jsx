import { useEffect, useMemo, useState } from "react";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FakeProgressBar({ compiler }) {
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState(compiler.accentColor);
  const [crashStage, setCrashStage] = useState("fill");
  const [rapidBugs, setRapidBugs] = useState(0);
  const [franticHits, setFranticHits] = useState(0);
  const [franticTick, setFranticTick] = useState(0);

  useEffect(() => {
    setProgress(0);
    setColor(compiler.accentColor);
    setCrashStage("fill");
    setRapidBugs(0);
    setFranticHits(0);
    setFranticTick(0);
  }, [compiler]);

  useEffect(() => {
    if (compiler.progressBarBehavior === "slow") {
      const timeout = setTimeout(() => setProgress(85), 60);
      return () => clearTimeout(timeout);
    }

    if (compiler.progressBarBehavior === "crash") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (crashStage === "fill") {
            const next = Math.min(97, prev + randomInt(3, 8));
            if (next >= 97) {
              setCrashStage("crashed");
              setTimeout(() => {
                setProgress(0);
                setCrashStage("refill");
              }, 120);
            }
            return next;
          }

          if (crashStage === "refill") {
            const next = Math.min(60, prev + randomInt(4, 9));
            if (next >= 60) {
              setCrashStage("frozen");
            }
            return next;
          }

          return prev;
        });
      }, 300);
      return () => clearInterval(interval);
    }

    const franticColors = ["#00ff88", "#ff3b3b", "#ffb800"];
    const interval = setInterval(() => {
      setFranticTick((prev) => prev + 1);
      setColor(franticColors[randomInt(0, franticColors.length - 1)]);
      setRapidBugs((prev) => prev + randomInt(1, 6));
    }, 180);

    return () => clearInterval(interval);
  }, [compiler, crashStage]);

  useEffect(() => {
    if (compiler.progressBarBehavior !== "frantic") {
      return;
    }

    if (franticTick > 0 && franticTick % 12 === 0 && franticHits < 2) {
      setProgress(100);
      setFranticHits((prev) => prev + 1);
      return;
    }

    if (franticHits >= 2 && franticTick % 14 === 0) {
      setProgress(0);
      setFranticHits(0);
      return;
    }

    setProgress(Math.random() * 100);
  }, [compiler.progressBarBehavior, franticHits, franticTick]);

  const label = useMemo(() => {
    const base = compiler.progressBarLabel;
    const withRandomPct = base.replace("[random %]", `${randomInt(12, 99)}%`);
    const low = randomInt(4, 46);
    const high = low + randomInt(3, 11);
    const withPairs = withRandomPct
      .replace("[random number]", `${low}`)
      .replace("[slightly higher number]", `${high}`);

    return withPairs.replace("[rapidly incrementing number]", `${rapidBugs}`);
  }, [compiler.progressBarLabel, rapidBugs, progress]);

  const barColor = compiler.progressBarBehavior === "slow" ? "#a78bfa" : compiler.progressBarBehavior === "crash" ? "#ff3b3b" : color;

  return (
    <div className="w-full px-5">
      <div className="mb-2 text-xs" style={{ color: "var(--accent)" }}>
        {label}
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-black/60">
        <div
          className={compiler.progressBarBehavior === "slow" ? "h-full" : "h-full transition-all duration-150"}
          style={{
            width: `${progress}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 6px ${barColor}`,
            transition: compiler.progressBarBehavior === "slow" ? "width 3s linear" : undefined,
          }}
        />
      </div>
    </div>
  );
}
