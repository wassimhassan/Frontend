import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WorkoutPlan.css"; // Optional: Create or reuse an existing CSS file

function WorkoutPlan() {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching workout plans with token:", token ? "Token exists" : "No token");
        
        if (!token) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }

        // Get user info first to determine role
        try {
          const userResponse = await axios.get("http://localhost:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserRole(userResponse.data.role);
          console.log("User role:", userResponse.data.role);
        } catch (userErr) {
          console.warn("Could not fetch user info:", userErr);
        }

        const response = await axios.get("http://localhost:5000/api/workouts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Received workout plans:", response.data);
        setWorkoutPlans(response.data);
      } catch (err) {
        console.error("Error fetching workout plans:", err);
        setError(
          err.response?.data?.error || 
          err.response?.data?.message || 
          "Failed to load workout plans."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutPlans();
  }, []);

  if (loading) return <div className="loading">Loading workout plans...</div>;
  
  if (error) return (
    <div className="error-container">
      <p className="error-message">{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <div className="client-workout-view">
      <h2>{userRole === "trainer" ? "📋 Created Workout Plans" : "📋 My Assigned Workouts"}</h2>

      {workoutPlans.length === 0 && (
        <p className="no-plans">
          {userRole === "trainer" 
            ? "You haven't created any workout plans yet." 
            : "No workout plans are assigned to you yet."}
        </p>
      )}

      <div className="workout-plans-grid">
        {workoutPlans.map((plan) => (
          <div key={plan._id} className="workout-card">
            <h3 className="plan-title">{plan.title}</h3>
            <p className="plan-description">{plan.description}</p>
            
            <h4 className="exercises-header">Exercises:</h4>
            <ul className="exercises-list">
              {plan.exercises.map((ex, i) => (
                <li key={i} className="exercise-item">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-details">
                    {ex.sets} sets × {ex.reps} reps
                    {ex.rest && <span className="rest-period"> • Rest: {ex.rest}</span>}
                  </div>
                  {ex.notes && <div className="exercise-notes">{ex.notes}</div>}
                </li>
              ))}
            </ul>

            {userRole === "trainer" && plan.assignedClients && (
              <div className="assigned-clients">
                <p>Assigned to {plan.assignedClients.length} client(s)</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkoutPlan;