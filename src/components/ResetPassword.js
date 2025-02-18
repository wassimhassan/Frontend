import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/confirm-reset`, {
        token,
        newPassword,
      });

      if (response.status === 200) {
        setMessage("Password reset successful! Redirecting...");
        setTimeout(() => (window.location.href = "/login"), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Reset failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
