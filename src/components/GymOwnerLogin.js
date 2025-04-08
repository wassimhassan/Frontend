import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./GymOwnerLogin.css";

const GymOwnerLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!pin.trim()) {
      setError("PIN is required");
      return false;
    }
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return false;
    }
    if (!/^\d+$/.test(pin)) {
      setError("PIN must contain only numbers");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/login`,
        { phoneNumber, pin }
      );

      console.log("Gym Owner Login Successful:", response.data);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "gymOwner");
      localStorage.setItem("gymOwnerId", response.data.owner._id);

      console.log("🔍 Role in Local Storage:", localStorage.getItem("role"));
      console.log("🔍 Token in Local Storage:", localStorage.getItem("token"));
      console.log("🔍 Gym Owner ID in Local Storage:", localStorage.getItem("gymOwnerId"));

      setTimeout(() => {
        navigate("/gym-owner/dashboard");
      }, 100);
    } catch (err) {
      console.error("Gym Owner Login Failed:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gymOwner-login-container">
      <Link to="/" className="back-to-home-link">← Back to Home</Link>
      <h2 className="gymOwner-login-title">Gym Owner Login</h2>
      {error && <p className="gymOwner-login-error">{error}</p>}
      <form className="gymOwner-login-form" onSubmit={handleLogin}>
        <div>
          <label className="gymOwner-login-label">Phone Number:</label>
          <input
            className="gymOwner-login-input"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </div>

        <div>
          <label className="gymOwner-login-label">4-Digit PIN:</label>
          <input
            className="gymOwner-login-input"
            type="password"
            placeholder="Enter your 4-digit PIN"
            required
            maxLength="4"
            pattern="\d{4}"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button 
          className="gymOwner-login-button" 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default GymOwnerLogin;