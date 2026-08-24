import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import{ apiBackend }from '../api/api.ts';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userData = { email, password };
      const res = await fetch(`${apiBackend}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + data.message);
        return;
      }

      if (data.message === "successful") {
        localStorage.setItem("token", data.token);
        navigate("/Forensic");
      } else {
        alert("Error occurred: " + data.message);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <h1 className="system-title">Login</h1>
        <input
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <span className="login-note">
          Enter your credentials to access the dashboard
        </span>
        <div className="login-footer">
          <Link to="/" className="back-home-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}