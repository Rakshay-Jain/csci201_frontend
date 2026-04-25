import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      // Mock login
      if (username === "user" && password === "password") {
        navigate("/social");
      } else if (username === "user") {
        setError("Incorrect password");
      } else {
        setError("Invalid username");
      }
    } else {
      // Mock signup
      if (username !== "user") {
        console.log("Account created:", { username, password });
        setMode("login");
        setUsername("");
        setPassword("");
      } else {
        setError("Username already exists");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="auth-toggle">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        <div className="login-header">
          <h1 className="login-title">
            {mode === "login" ? "Login" : "Create Account"}
          </h1>
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

          <button type="submit" className="login-btn">
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <button className="guest-btn" 
            onClick={() => navigate("/social")}
          >
            Continue as Guest
          </button>
          <br />
        </div>
      </div>
    </div>
  );
}
