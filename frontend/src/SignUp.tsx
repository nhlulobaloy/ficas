import { useState } from "react";
import '../styles/Auth.css'

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const userData = {name, email, password}
    const res = await fetch(`http://localhost:3000/api/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(userData),
    });
    
    const data = await res.json();
    console.log(data);
  }
  

  return (
    <div className="login-page-wrapper">
      <h1 className="system-title">FICAS</h1>
      <div className="login-container">
        <h1 style={{ color: '#1a365d', fontSize: "24px", marginBottom: "20px" }}>Sign Up</h1>
        
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
        />

        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-btn" onClick={handleSubmit}>Create Account</button>
        
        <span className="login-note">
          Already have an account? <a href="/login" style={{color: '#163a5f'}}>Login here</a>
        </span>
      </div>
    </div>
  );
};