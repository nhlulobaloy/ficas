import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "'Inter', sans-serif",
            backgroundColor: "#f7fafc",
            color: "#1a202c",
            textAlign: "center",
            padding: "20px"
        }}>
            <h1 style={{ fontSize: "72px", margin: 0, color: "#2b6cb0" }}>404</h1>
            <h2 style={{ fontSize: "24px", margin: "16px 0", fontWeight: 600 }}>
                Page Not Found
            </h2>
            <p style={{ color: "#4a5568", marginBottom: "32px", maxWidth: "400px" }}>
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/Incident"
                style={{
                    backgroundColor: "#2b6cb0",
                    color: "white",
                    padding: "12px 32px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontWeight: 600,
                }}
            >
                Back to Home
            </Link>
        </div>
    );
}