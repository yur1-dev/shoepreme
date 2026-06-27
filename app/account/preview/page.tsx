// DEV ONLY — remove before production
import AccountClient from "@/components/account/AccountClient";
import Navbar from "@/components/layout/Navbar";

export default function AccountPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "400px",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,48,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Navbar />
      <div style={{ position: "relative", zIndex: 1, paddingTop: "80px" }}>
        <AccountClient
          customerId="preview-customer-id"
          customer={{
            displayName: "Marc",
            email: "marc@shoepreme.com",
            phone: "+639123456789",
            numberOfOrders: 3,
          }}
          SignOutButton={
            <button
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.35)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "7px",
                padding: "7px 12px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          }
        />
      </div>
    </div>
  );
}
