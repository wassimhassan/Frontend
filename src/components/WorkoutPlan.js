import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WorkoutPlan.css";

function WorkoutPlan() {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [completedWorkouts, setCompletedWorkouts] = useState({});
  const [userId, setUserId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        console.log("Fetching workout plans with token:", token ? "Token exists" : "No token");
        setUserId(storedUserId);

        if (!token) {
          setTokenValid(false);
          setError("Authentication required. Please log in again.");
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
          if (userErr.response?.status === 401) {
            setTokenValid(false);
            setError("Your session has expired. Please log in again.");
            setLoading(false);
            return;
          }
        }

        const response = await axios.get("http://localhost:5000/api/workouts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Received workout plans:", response.data);
        setWorkoutPlans(response.data);

        // Fetch existing progress data
        if (storedUserId) {
          try {
            const progressResponse = await axios.get(`http://localhost:5000/api/progress/${storedUserId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (progressResponse.data) {
              console.log("Loaded progress data:", progressResponse.data);
              setCompletedExercises(progressResponse.data.completedExercises || {});
              setCompletedWorkouts(progressResponse.data.completedWorkouts || {});
            }
          } catch (progressErr) {
            console.warn("Could not fetch progress data:", progressErr);
            // Initialize progress tracking
            initializeProgressTracking(response.data);
          }
        } else {
          // Initialize progress tracking
          initializeProgressTracking(response.data);
        }
      } catch (err) {
        console.error("Error fetching workout plans:", err);
        if (err.response?.status === 401) {
          setTokenValid(false);
          setError("Authentication failed. Please log in again.");
        } else {
          setError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load workout plans."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutPlans();
  }, []);

  const initializeProgressTracking = (plans) => {
    const initialExercises = {};
    const initialWorkouts = {};
    plans.forEach(plan => {
      initialWorkouts[plan._id] = false;
      plan.exercises.forEach((ex, index) => {
        const key = `${plan._id}-${index}`;
        initialExercises[key] = false;
      });
    });
    setCompletedExercises(initialExercises);
    setCompletedWorkouts(initialWorkouts);
  };

  const markExerciseComplete = (planId, exerciseIndex) => {
    setCompletedExercises(prev => {
      const key = `${planId}-${exerciseIndex}`;
      const updatedExercises = {
        ...prev,
        [key]: !prev[key]
      };

      // Auto-check if all exercises are completed
      const plan = workoutPlans.find(p => p._id === planId);
      if (plan) {
        const allCompleted = plan.exercises.every((_, index) => {
          const exerciseKey = `${planId}-${index}`;
          return updatedExercises[exerciseKey];
        });

        // If auto-complete option is enabled, mark workout as complete
        if (allCompleted && !completedWorkouts[planId]) {
          setCompletedWorkouts(prevWorkouts => ({
            ...prevWorkouts,
            [planId]: true
          }));
          // Show temporary message that workout is completed
          setSaveStatus({ type: "info", message: "All exercises completed! Workout marked as done." });
          setTimeout(() => setSaveStatus(null), 3000);
        }
      }

      return updatedExercises;
    });
  };

  const markWorkoutComplete = (planId) => {
    setCompletedWorkouts(prev => {
      const isCompleting = !prev[planId];
      const updatedWorkouts = {
        ...prev,
        [planId]: isCompleting
      };

      // When marking a workout complete/incomplete, also mark all its exercises
      const updatedExercises = { ...completedExercises };
      const plan = workoutPlans.find(p => p._id === planId);
      if (plan) {
        plan.exercises.forEach((_, index) => {
          const key = `${planId}-${index}`;
          updatedExercises[key] = isCompleting;
        });
        setCompletedExercises(updatedExercises);
      }

      return updatedWorkouts;
    });
  };

  const checkIfAllExercisesComplete = (planId) => {
    const plan = workoutPlans.find(p => p._id === planId);
    if (!plan) return false;

    return plan.exercises.every((_, index) => {
      const key = `${planId}-${index}`;
      return completedExercises[key];
    });
  };

  const saveProgress = async () => {
    const token = localStorage.getItem("token");
    if (!token || !userId) {
      setSaveStatus({ type: "error", message: "Authentication required to save progress." });
      return;
    }

    setSaveStatus({ type: "loading", message: "Saving your progress..." });

    try {
      const progressData = {
        userId,
        completedExercises,
        completedWorkouts,
        timestamp: new Date().toISOString()
      };

      // Save progress to the backend
      const response = await axios.post(
        "http://localhost:5000/api/progress/save",
        progressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Progress saved:", response.data);
      setSaveStatus({ type: "success", message: "Progress saved successfully!" });

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Error saving progress:", err);
      if (err.response?.status === 401) {
        setSaveStatus({
          type: "error",
          message: "Your session has expired. Please log in again."
        });
        setTokenValid(false);
      } else {
        setSaveStatus({
          type: "error",
          message: err.response?.data?.error || "Failed to save progress. Please try again."
        });
      }
    }
  };

  const handleLogIn = () => {
    // Redirect to login page
    window.location.href = "/login";
  };

  if (loading) return <div className="loading">Loading workout plans...</div>;

  if (!tokenValid) {
    return (
      <div className="auth-error-container">
        <p className="auth-error-message">{error || "Your session has expired."}</p>
        <button className="login-btn" onClick={handleLogIn}>
          Log In Again
        </button>
      </div>
    );
  }

  if (error) return (
    <div className="error-container">
      <p className="error-message">{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  // Separate active and completed workouts
  const activeWorkouts = workoutPlans.filter(plan => !completedWorkouts[plan._id]);
  const completedWorkoutPlans = workoutPlans.filter(plan => completedWorkouts[plan._id]);

  // Determine which plans to show based on the toggle
  const visibleActiveWorkouts = activeWorkouts;
  const visibleCompletedWorkouts = showCompleted ? completedWorkoutPlans : [];

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

      {/* Save status message */}
      {saveStatus && (
        <div className={`save-status ${saveStatus.type}`}>
          {saveStatus.message}
        </div>
      )}

      {/* Active Workouts Section */}
      {visibleActiveWorkouts.length > 0 && (
        <>
          <h3 className="section-header">Active Workouts</h3>
          <div className="workout-plans-grid">
            {visibleActiveWorkouts.map((plan) => (
              <div
                key={plan._id}
                className="workout-card"
              >
                <h3 className="plan-title">{plan.title}</h3>
                <p className="plan-description">{plan.description}</p>

                <h4 className="exercises-header">Exercises:</h4>
                <ul className="exercises-list">
                  {plan.exercises.map((ex, i) => (
                    <li
                      key={i}
                      className={`exercise-item ${completedExercises[`${plan._id}-${i}`] ? 'exercise-completed' : ''}`}
                    >
                      <div className="exercise-name">{ex.name}</div>
                      <div className="exercise-details">
                        {ex.sets} sets × {ex.reps} reps
                        {ex.rest && <span className="rest-period"> • Rest: {ex.rest}</span>}
                      </div>
                      {ex.notes && <div className="exercise-notes">{ex.notes}</div>}

                      {userRole !== "trainer" && (
                        <button
                          className={`exercise-done-btn ${completedExercises[`${plan._id}-${i}`] ? 'done' : ''}`}
                          onClick={() => markExerciseComplete(plan._id, i)}
                        >
                          {completedExercises[`${plan._id}-${i}`] ? '✓ Done' : 'Mark Done'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {userRole === "trainer" && plan.assignedClients && (
                  <div className="assigned-clients">
                    <p>Assigned to {plan.assignedClients.length} client(s)</p>
                  </div>
                )}

                {userRole !== "trainer" && (
                  <div className="workout-actions">
                    <button
                      className="workout-complete-btn"
                      onClick={() => markWorkoutComplete(plan._id)}
                    >
                      {checkIfAllExercisesComplete(plan._id)
                        ? 'All Exercises Done - Complete Workout'
                        : 'Complete Workout'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* No active workouts message */}
      {visibleActiveWorkouts.length === 0 && workoutPlans.length > 0 && (
        <p className="no-plans">No active workouts. All workouts are completed!</p>
      )}

      {/* Save Progress Button */}
      {workoutPlans.length > 0 && userRole !== "trainer" && (
        <div className="save-progress">
          <button className="save-btn" onClick={saveProgress}>
            Save Progress
          </button>
        </div>
      )}
      
      {/* Toggle for completed workouts */}
      {userRole !== "trainer" && completedWorkoutPlans.length > 0 && (
        <div className="workout-filters">
          <label className="show-completed-toggle">
            <input 
              type="checkbox" 
              checked={showCompleted} 
              onChange={() => setShowCompleted(!showCompleted)}
            />
            Show completed workouts
          </label>
        </div>
      )}

      {/* Completed Workouts Section */}
      {visibleCompletedWorkouts.length > 0 && (
        <>
          <h3 className="section-header completed-section">Completed Workouts</h3>
          <div className="workout-plans-grid completed-grid">
            {visibleCompletedWorkouts.map((plan) => (
              <div
                key={plan._id}
                className="workout-card workout-completed"
              >
                <h3 className="plan-title">{plan.title}</h3>
                <p className="plan-description">{plan.description}</p>

                <h4 className="exercises-header">Exercises:</h4>
                <ul className="exercises-list">
                  {plan.exercises.map((ex, i) => (
                    <li
                      key={i}
                      className="exercise-item exercise-completed"
                    >
                      <div className="exercise-name">{ex.name}</div>
                      <div className="exercise-details">
                        {ex.sets} sets × {ex.reps} reps
                        {ex.rest && <span className="rest-period"> • Rest: {ex.rest}</span>}
                      </div>
                      {ex.notes && <div className="exercise-notes">{ex.notes}</div>}

                      {userRole !== "trainer" && (
                        <button
                          className="exercise-done-btn done"
                          onClick={() => markExerciseComplete(plan._id, i)}
                        >
                          ✓ Done
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {userRole === "trainer" && plan.assignedClients && (
                  <div className="assigned-clients">
                    <p>Assigned to {plan.assignedClients.length} client(s)</p>
                  </div>
                )}

                {userRole !== "trainer" && (
                  <div className="workout-actions">
                    <button
                      className="workout-complete-btn completed"
                      onClick={() => markWorkoutComplete(plan._id)}
                    >
                      ✓ Workout Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WorkoutPlan;