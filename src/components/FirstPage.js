import React from "react";
import { useNavigate } from "react-router-dom";
import "./FirstPage.css"; // Import your CSS file for styling

const FirstPage = () => {
  const navigate = useNavigate();

  return (
    <div className="role-selection-wrapper">
      <h1 className="role-selection-heading">Choose Your Role</h1>
      <div className="role-selection-buttons">
        <button
          className="role-button trainer-button"
          onClick={() => navigate("/trainer-login")}
        >
          Personal Trainer
        </button>
        <button
          className="role-button client-button"
          onClick={() => navigate("/WelcomePage")}
        >
          Client
        </button>
        <button
          className="role-button owner-button"
          onClick={() => navigate("/gym-owner-login")}
        >
          Gym Owner
        </button>
      </div>
    </div>
  );
};

export default FirstPage;