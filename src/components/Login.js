import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        // Save token to localStorage
        localStorage.setItem("token", response.data.token);

        // Redirect to dashboard or home page
        window.location.href = "/dashboard"; // Change this to the correct route
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Try again.");
      setForgotEmail(email);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, {
        email: forgotEmail,
      });

      if (response.status === 200) {
        setResetMessage("Password reset link sent! Check your email.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send reset link. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-box">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="forgot-password">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setForgotEmail(email); // ✅ Auto-fill email when opening the modal
                setShowForgotPassword(true);
              }}
            >
              Forgot Password?
            </a>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

       {/* Forgot Password Modal */}
       {showForgotPassword && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reset Password</h3>
            <p>Enter your email to receive a reset link:</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            {resetMessage && <p className="success-message">{resetMessage}</p>}
            {error && <p className="error-message">{error}</p>}
            <button onClick={handleForgotPassword} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button onClick={() => setShowForgotPassword(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;