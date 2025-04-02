import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./GymOwnerLogin.css"; 
const GymOwnerLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/login`,
        { phoneNumber, pin }
      );

      console.log("Gym Owner Login Successful:", response.data);

      // ✅ Save token and role in localStorage BEFORE navigating
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "gymOwner");

      console.log("🔍 Role in Local Storage:", localStorage.getItem("role")); // ✅ Debugging step
      console.log("🔍 Token in Local Storage:", localStorage.getItem("token"));

      // ✅ Delay navigation slightly to ensure localStorage is updated
      setTimeout(() => {
        navigate("/gym-owner/dashboard");
      }, 100);
    } catch (err) {
      console.error("Gym Owner Login Failed:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gymOwner-login-container">
      <h2 className="gymOwner-login-title">Gym Owner Login</h2>
      {error && <p className="gymOwner-login-error">{error}</p>}
      <form className="gymOwner-login-form" onSubmit={handleLogin}>
        <label className="gymOwner-login-label">Phone Number:</label>
        <input
          className="gymOwner-login-input"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />

        <label className="gymOwner-login-label">4-Digit PIN:</label>
        <input
          className="gymOwner-login-input"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          maxLength={4}
        />

        <button 
          className="gymOwner-login-button" 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <button 
  className="gymOwner-back-button" 
  onClick={() => navigate("/")}
>
  ← Back to Home
</button>
    </div>
  );
};

export default GymOwnerLogin;