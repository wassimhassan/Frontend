import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./AssignWorkout.css";

function AssignWorkout() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromURL = queryParams.get("clientId"); // Get clientId from URL

  // Mock client details (to display the client's name)
  const mockClients = {
    "1": "John Doe",
    "2": "Jane Smith",
    "3": "Mike Johnson",
  };

  // Get the client's name
  const clientName = mockClients[clientIdFromURL] || "Unknown Client";

  // State for workout details
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // NEW: Loading state

  // Assign Workout Plan (Mock Action)
  const handleAssignPlan = () => {
    if (!workoutTitle.trim() || !workoutDescription.trim()) {
      setMessage("❌ Please enter a workout title and description.");
      return;
    }

    setLoading(true); // Start loading
    setMessage(""); // Clear previous messages

    // Simulate API request (2 seconds delay)
    setTimeout(() => {
      setLoading(false); // Stop loading
      setMessage(`✅ Workout plan "${workoutTitle}" assigned to ${clientName}`);
    }, 2000);
  };

  return (
    <div className="assign-container">
      <h2>Assign Workout Plan</h2>

      {/* Display Client Name */}
      <p><strong>Client:</strong> {clientName}</p>

      <label>Workout Plan Title:</label>
      <input 
        type="text" 
        value={workoutTitle} 
        onChange={(e) => setWorkoutTitle(e.target.value)} 
        placeholder="Enter workout title" 
        className="input-field"
      />

      <label>Workout Plan Description:</label>
      <textarea
        value={workoutDescription}
        onChange={(e) => setWorkoutDescription(e.target.value)}
        placeholder="Enter workout description"
        className="input-field"
      />

      <button className="submit-btn" onClick={handleAssignPlan} disabled={loading}>
        {loading ? "Assigning..." : "Assign Plan"}
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default AssignWorkout;
