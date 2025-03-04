import React from "react";
import { useNavigate } from "react-router-dom"; // For navigation

const WelcomePage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Choose Your Role</h1>
      <div style={styles.buttonContainer}>
        <button
          style={styles.button}
          onClick={() => navigate("/trainer-login")} // Navigate to TrainerLogin
        >
          Personal Trainer
        </button>
        <button
          style={styles.button}
          onClick={() => navigate("/WelcomePage")} // Navigate to Client
        >
          Client
        </button>
      </div>
    </div>
  );
};

// Inline styles for simplicity
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f0f0", // Light gray background
    padding: "20px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333", // Dark gray text
  },
  buttonContainer: {
    display: "flex",
    gap: "10px", // Space between buttons
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    backgroundColor: "#007bff", // Blue background
    color: "#fff", // White text
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};

export default WelcomePage;