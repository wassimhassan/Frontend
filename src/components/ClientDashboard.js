import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ClientDashboard.css"; // Import CSS for styling

const ClientDashboard = () => {
  const [assignedPlans, setAssignedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionStatus, setCompletionStatus] = useState({});

  // Create axios instance with default headers
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    if (!token || !userId || !role) {
      console.error('Missing authentication data:', { token, userId, role });
      navigate('/login');
      return;
    }

    if (role !== 'client') {
      console.error('Invalid role:', role);
      navigate('/login');
      return;
    }

    // Set up request interceptor for authentication
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    fetchWorkoutPlans();
  }, [navigate]);

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/workouts/client');
      console.log('Workout plans response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setAssignedPlans(response.data);
        
        // Initialize completion status for each exercise
        const initialStatus = {};
        const userId = localStorage.getItem('userId');
        response.data.forEach(plan => {
          const clientProgress = plan.clientProgress?.find(
            progress => progress.clientId === userId
          );
          
          initialStatus[plan._id] = {
            exercises: plan.exercises.map((ex, index) => {
              const exerciseProgress = clientProgress?.exercises[index];
              return exerciseProgress?.completed || false;
            }),
            workoutCompleted: clientProgress?.isCompleted || false
          };
        });
        setCompletionStatus(initialStatus);
      } else {
        setAssignedPlans([]);
      }
    } catch (err) {
      console.error('Error fetching workout plans:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        navigate('/login');
      } else {
        setError('Failed to fetch workout plans. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseComplete = async (workoutId, exerciseIndex) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5000/api/workouts/${workoutId}/exercises/${exerciseIndex}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the local state with the new progress
      setAssignedPlans(prevPlans => 
        prevPlans.map(plan => {
          if (plan._id === workoutId) {
            return {
              ...plan,
              clientProgress: res.data.progress
            };
          }
          return plan;
        })
      );
      
      // Also update the completion status
      setCompletionStatus(prevStatus => ({
        ...prevStatus,
        [workoutId]: {
          ...prevStatus[workoutId],
          exercises: prevStatus[workoutId].exercises.map((ex, idx) => 
            idx === exerciseIndex ? true : ex
          ),
          workoutCompleted: res.data.isWorkoutCompleted || prevStatus[workoutId].workoutCompleted
        }
      }));

      if (res.data.isWorkoutCompleted) {
        alert("Congratulations! You've completed the entire workout! 🎉");
      }
    } catch (err) {
      console.error("Error marking exercise as completed:", err);
      alert("Failed to mark exercise as completed. Please try again.");
    }
  };

  if (loading) {
    return <div className="client-dashboard">Loading your workouts...</div>;
  }

  if (error) {
    return <div className="client-dashboard error">{error}</div>;
  }

  return (
    <div className="client-dashboard">
      <h2>My Assigned Workout Plans</h2>

      {assignedPlans.length === 0 ? (
        <p>No workout plans assigned yet.</p>
      ) : (
        <ul>
          {assignedPlans.map((plan) => {
            const progress = plan.clientProgress?.find(p => p.clientId === localStorage.getItem("userId"));
            const isWorkoutCompleted = progress?.isCompleted;

            return (
              <li key={plan._id} className={`plan-card ${isWorkoutCompleted ? 'completed' : ''}`}>
                <h3>{plan.title}</h3>
                <p><strong>Description:</strong> {plan.description}</p>
                {isWorkoutCompleted && (
                  <div className="completion-badge">✅ Completed</div>
                )}
                <h4>Exercises:</h4>
                <ul className="exercise-list">
                  {plan.exercises.map((exercise, index) => {
                    const exerciseProgress = progress?.exercises[index];
                    const isCompleted = exerciseProgress?.completed;

                    return (
                      <li 
                        key={index} 
                        className={`exercise-item ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="exercise-info">
                          {exercise.name} - {exercise.sets} sets x {exercise.reps} reps
                          {exercise.rest && ` (Rest: ${exercise.rest}s)`}
                        </div>
                        {!isCompleted && (
                          <button
                            className="complete-btn"
                            onClick={() => handleExerciseComplete(plan._id, index)}
                          >
                            Mark as Done
                          </button>
                        )}
                        {isCompleted && (
                          <span className="completed-badge">✅ Done</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ClientDashboard;