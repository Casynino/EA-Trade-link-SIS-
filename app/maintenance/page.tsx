export const metadata = { title: "Under Maintenance — EA Trade Link" }

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050b1f 0%, #080f28 50%, #0a0e1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* Gold top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(to right, #D4AF37, #C8102E, #D4AF37)",
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: "rgba(212,175,55,0.1)",
          border: "1.5px solid rgba(212,175,55,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
          fontSize: 32,
        }}
      >
        🔗
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
          fontWeight: 800,
          color: "#ffffff",
          margin: "0 0 0.75rem",
          letterSpacing: "-0.02em",
        }}
      >
        Under Maintenance
      </h1>

      <p
        style={{
          fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
          color: "rgba(255,255,255,0.45)",
          maxWidth: 460,
          lineHeight: 1.65,
          margin: "0 0 2.5rem",
        }}
      >
        We&apos;re making some improvements to EA Trade Link. We&apos;ll be back shortly. Thank you for your patience.
      </p>

      {/* Status badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: 999,
          padding: "0.5rem 1.25rem",
          color: "#D4AF37",
          fontSize: "0.85rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#D4AF37",
            display: "inline-block",
            animation: "pulse 2s infinite",
          }}
        />
        MAINTENANCE IN PROGRESS
      </div>

      {/* Contact line */}
      <p
        style={{
          marginTop: "3rem",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        Questions? Reach us at{" "}
        <a
          href="mailto:info@eatradelink.com"
          style={{ color: "rgba(212,175,55,0.6)", textDecoration: "none" }}
        >
          info@eatradelink.com
        </a>
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
