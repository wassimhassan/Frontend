import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./GymOwnerLogin.css"; // Ensure this file exists

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
      const response = axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/login`, { phoneNumber, pin })
      .then((response) => {
        console.log("Gym Owner Login Successful:", response.data);
    
        // ✅ Save token and role
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", "gymOwner");
    
        console.log("🔍 Role in Local Storage:", localStorage.getItem("role")); // ✅ Debugging step
        console.log("🔍 Token in Local Storage:", localStorage.getItem("token"));
    
        // ✅ Navigate to Dashboard
        navigate("/gym-owner/dashboard");
      })
      .catch((error) => {
        console.error("Gym Owner Login Failed:", error.response?.data?.message || error.message);
      });
    
    

      // ✅ Store token and role in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "gymOwner");

      setLoading(false);
      navigate("/gym-owner/dashboard"); // Redirect to Gym Owner Dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Gym Owner Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <label>Phone Number:</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />

        <label>4-Digit PIN:</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          maxLength={4}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default GymOwnerLogin;
