import React from "react";
import { useNavigate } from "react-router-dom"; 
import "./FirstPage.css"; 

const FirstPage = () => {
  const navigate = useNavigate(); 

  return (
    <div className="FP-container">
      <h1 className="FP-title">Choose Your Role</h1>
      <div className="FP-button-container">
        <button
          className="FP-button"
          onClick={() => navigate("/trainer-login")} 
        >
          Personal Trainer
        </button>
        <button
          className="FP-button"
          onClick={() => navigate("/WelcomePage")} 
        >
          Client
        </button>
        <button
          className="FP-button"
          onClick={() => navigate("/gym-owner-login")} 
        >
          Gym Owner
        </button>
      </div>
    </div>
  );
};

export default FirstPage;