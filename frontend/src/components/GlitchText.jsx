export default function GlitchText({ text, active, color }) {
  return (
    <span
      className={active ? "animate-glitch" : ""}
      style={{ color: color ?? "var(--accent)", display: "inline-block" }}
    >
      {text}
    </span>
  );
}
