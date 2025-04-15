import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TrainerLogin.css"; 

const TrainerLogin = ({ setTrainerId }) => {
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
      localStorage.setItem("trainerId", trainer.id); // ✅ Correct Key
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

  const handleBack = () => {
    navigate("/FirstPage"); // Navigate back to the first page
  };


  return (
    <div className="trainer-auth-wrapper">
      <div className="trainer-auth-back-button" onClick={handleBack}>
         Back
      </div>
      <div className="trainer-auth-card">
        <h2 className="trainer-auth-heading">Trainer Login</h2>
        <form className="trainer-auth-form" onSubmit={handleLogin}>
          <div className="trainer-auth-input-group">
            <label className="trainer-auth-label">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="trainer-auth-input"
              required
            />
          </div>

          <div className="trainer-auth-input-group">
            <label className="trainer-auth-label">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="trainer-auth-input"
              required
            />
          </div>

          <button type="submit" className="trainer-auth-submit-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrainerLogin;