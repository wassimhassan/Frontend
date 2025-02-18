import React, { useState } from "react";
import axios from "axios";
import "./SignUp.css";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({
    fullName: "",
    height: "",
    weight: "",
    dob: "",
    phone: "",
    workoutDays: "",
    goal: [], // Allows multiple selections
    customGoal: "", // Custom goal field
    sex: "",
  });

  const fields = [
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "height", label: "Height (cm)", type: "number" },
    { key: "weight", label: "Weight (kg)", type: "number" },
    { key: "dob", label: "Date of Birth", type: "date" },
    { key: "phone", label: "Phone Number", type: "text" },
    { key: "workoutDays", label: "Workout Days Per Week", type: "number" },
    { key: "sex", label: "Select Sex", type: "select", options: ["Male", "Female"] },
  ];

  const goals = ["Muscle Gain", "Weight Loss", "Improve Stamina", "Stay Fit", "Other"];

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  const handleGoalSelection = (goal) => {
    if (goal === "Other") {
      setUserData({ ...userData, goal: [], customGoal: "" });
    } else {
      setUserData((prev) => ({
        ...prev,
        goal: prev.goal.includes(goal)
          ? prev.goal.filter((g) => g !== goal) // Remove if already selected
          : [...prev.goal, goal], // Add new goal
        customGoal: "", // Reset custom goal if a predefined goal is chosen
      }));
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError("All fields are required.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
  
      setLoading(true);
      try {
        // Validate email & password instantly
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/validate-credentials`, {
          email,
          password,
        });
  
        if (response.status === 200) {
          setStep(2); //  Move to the next step ONLY if credentials are valid
          setError("");
        }
      } catch (error) {
        setError(error.response?.data?.message || "Validation failed. Try again.");
      }
      setLoading(false);
    } else {
      if (currentFieldIndex < fields.length - 1) {
        setCurrentFieldIndex(currentFieldIndex + 1);
      } else {
        try {
          setLoading(true);
  
          const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, {
            username: userData.fullName, //  Ensure username is sent
            email,
            password,
            height: userData.height || 0,
            weight: userData.weight || 0,
            dateOfBirth: userData.dob || null,
            phoneNumber: userData.phone || "",
            workoutDaysPerWeek: userData.workoutDays || 3,
            goal: userData.goal.length > 0 ? userData.goal : userData.customGoal,
            sex: userData.sex || "none",
          });
  
          if (response.status === 201) {
            alert("Sign Up Successful!");
            window.location.href = "/login";
          }
        } catch (error) {
          setError(error.response?.data?.message || "Signup failed. Try again.");
        }
      }
    }
  };
  
  const handleBack = () => {
    if (step === 2 && currentFieldIndex === 0) {
      setStep(1); // Go back to step 1 (Email & Password)
    } else if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>

        {step === 1 ? (
          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button onClick={handleNext}>Create Account</button>
          </div>
        ) : currentFieldIndex === fields.length ? (
          <div className="input-box">
            <h3>Select Your Goals</h3>
            <div className="goal-options">
              {goals.map((goal) => (
                <button
                  key={goal}
                  className={userData.goal.includes(goal) ? "selected" : ""}
                  onClick={() => handleGoalSelection(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
            {userData.goal.includes("Other") && (
              <input
                type="text"
                placeholder="Enter your goal"
                value={userData.customGoal}
                onChange={(e) => setUserData({ ...userData, customGoal: e.target.value })}
              />
            )}
            <button onClick={handleNext} disabled={loading}>
              {loading ? "Saving..." : "Finish"}
            </button>
          </div>
        ) : (
          <div className="input-box">
            <label>{fields[currentFieldIndex].label}</label>
            {fields[currentFieldIndex].type === "select" ? (
              <select
                value={userData[fields[currentFieldIndex].key]}
                onChange={(e) =>
                  setUserData({ ...userData, [fields[currentFieldIndex].key]: e.target.value })
                }
              >
                <option value="">Select</option>
                {fields[currentFieldIndex].options.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={fields[currentFieldIndex].type}
                value={userData[fields[currentFieldIndex].key]}
                onChange={(e) =>
                  setUserData({ ...userData, [fields[currentFieldIndex].key]: e.target.value })
                }
              />
            )}
            <button onClick={handleNext} disabled={loading}>
              {loading ? "Saving..." : currentFieldIndex < fields.length - 1 ? "Next" : "Finish"}
            </button>            
            <button onClick={() => setCurrentFieldIndex(currentFieldIndex + 1)} className="skip-btn">
              Skip
            </button>
            <button onClick={handleBack} className="back-btn">Back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
