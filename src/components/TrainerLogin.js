import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TrainerLogin = ({ setTrainerId}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/login`, {
        email,
        password,
      });

      const { token, trainer } = response.data;

      if (!trainer || !trainer.id) {
        console.error("❌ Invalid trainer data received from backend.");
        alert("Login failed. Please try again.");
        return;
      }

      // ✅ Store Trainer ID & Token in Local Storage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", trainer.id);
      localStorage.setItem("role", "trainer");

      console.log("✅ Trainer logged in successfully. Trainer ID:", trainer.id);
      console.log("📌 Stored Token:", localStorage.getItem("token"));
      console.log("📌 Stored Role:", localStorage.getItem("role"));

      // ✅ Force reloading to make sure role is applied
      window.location.href = "/profile"; 
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="tl-container">
      <h2 className="tl-title">Trainer Login</h2>
      <form className="tl-form" onSubmit={handleLogin}>
        <label className="tl-label">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tl-input"
          required
        />

        <label className="tl-label">Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tl-input"
          required
        />

        <button type="submit" className="tl-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default TrainerLogin;
