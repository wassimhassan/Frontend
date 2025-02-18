import React from "react";
import "./SignUp.css";

const SignUp = () => {
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        <form>
          <input type="text" placeholder="Full Name" required />
          <input type="number" placeholder="Age" required />
          <input type="number" placeholder="Height (cm)" required />
          <input type="number" placeholder="Weight (kg)" required />
          <input type="date" placeholder="Date of Birth" required />
          <input type="email" placeholder="Email" required />
          <input type="text" placeholder="Phone Number" required />
          <input type="number" placeholder="Workout Days Per Week" required />
          <input type="text" placeholder="Goal (e.g., muscle gain, weight loss)" required />
          <select required>
            <option value="">Select Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button type="submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
