import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const userData = { email, password };
      const res = await fetch(`http://localhost:3000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      const token = data.token;
      if (data.message === "successful") {
        localStorage.setItem("token", token);
        navigate("/Forensic");
      } else {
        alert("Error occurred: " + data.message);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error(`Error: ${error}`);
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
        <button className="login-btn" onClick={handleSubmit}>
          Login
        </button>
        <span className="login-note">
          Enter your credentials to access the dashboard
        </span>
      </div>
    </div>
  );
}
