import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock authentication - replace with real auth logic
    if (username === "user" && password === "password") {
        // Simulate login success
        navigate("/social");
    } else {
        setError("Invalid username or password");
    }
    
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Login</h1>
          {/* <p className="login-subtitle">Sign in to your account</p> */}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            {/* <label htmlFor="email" className="form-label">
              Email
            </label> */}
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="form-group">
            {/* <label htmlFor="password" className="form-label">
              Password
            </label> */}
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" name="action" value="login">
            Login
          </button>
        </form>

        <div className="login-footer">
          <a href="https://www.google.com/" style={{fontFamily: 'DM Sans'}}>
            Forgot password?
          </a>
          <br />
          <button type="submit" className="guest-btn" onClick={() => navigate("/social")}>
            Continue as Guest
          </button>
          <br />
        </div>
      </div>
    </div>
  );
}