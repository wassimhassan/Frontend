import React from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import "./FirstPage.css"; // Import the CSS file

const FirstPage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <div className="FP-container">
      <h1 className="FP-title">Choose Your Role</h1>
      <div className="FP-button-container">
        <button
          className="FP-button"
          onClick={() => navigate("/trainer-login")} // Navigate to TrainerLogin
        >
          Personal Trainer
        </button>
        <button
          className="FP-button"
          onClick={() => navigate("/WelcomePage")} // Navigate to Client
        >
          Client
        </button>
      </div>
    </div>
  );
};

export default FirstPage;