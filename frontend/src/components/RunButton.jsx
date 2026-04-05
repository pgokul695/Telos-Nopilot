import { motion } from "framer-motion";

export default function RunButton({ onClick, isRunning, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isRunning || disabled}
      whileTap={{ scale: 0.96 }}
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 12,
        padding: "6px 14px",
        background: isRunning ? "transparent" : "var(--accent)",
        color: isRunning ? "var(--accent)" : "#000",
        border: "1px solid var(--accent)",
        borderRadius: 4,
        cursor: isRunning ? "not-allowed" : "pointer",
        letterSpacing: "0.05em",
        opacity: disabled && !isRunning ? 0.4 : 1,
        transition: "all 150ms",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {isRunning ? (
        <>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
          running
        </>
      ) : (
        <>▶ RUN</>
      )}
    </motion.button>
  );
}
