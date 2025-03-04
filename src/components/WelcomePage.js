import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./WelcomePage.css";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="overlay">
        {/* Welcome Text */}
        <h1>Welcome!</h1>

        {/* Buttons */}
        <div className="buttons">
          <button className="btn" onClick={() => navigate('/SignUp')}>Sign Up</button>
          <button className="btn" onClick={() => navigate('/Login')}>Log In</button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

