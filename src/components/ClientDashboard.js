import React, { useState } from "react";
import "./ClientDashboard.css"; // Import CSS for styling

function ClientDashboard() {
  // Mock data: Assigned workout plans for the logged-in client
  const [assignedPlans] = useState([
    {
      id: "plan1",
      title: "Upper Body Strength",
      description: "A workout focusing on chest and arms.",
      exercises: [
        { name: "Bench Press", sets: 3, reps: 12 },
        { name: "Bicep Curls", sets: 4, reps: 10 }
      ],
      progress: "Not Started"
    },
    {
      id: "plan2",
      title: "Leg Day Routine",
      description: "A workout to build lower body strength.",
      exercises: [
        { name: "Squats", sets: 4, reps: 15 },
        { name: "Leg Press", sets: 3, reps: 12 }
      ],
      progress: "In Progress"
    }
  ]);

  return (
    <div className="client-dashboard">
      <h2>My Assigned Workout Plans</h2>

      {assignedPlans.length === 0 ? (
        <p>No workout plans assigned yet.</p>
      ) : (
        <ul>
          {assignedPlans.map((plan) => (
            <li key={plan.id} className="plan-card">
              <h3>{plan.title}</h3>
              <p><strong>Description:</strong> {plan.description}</p>
              <p><strong>Progress:</strong> {plan.progress}</p>
              <h4>Exercises:</h4>
              <ul className="exercise-list">
                {plan.exercises.map((exercise, index) => (
                  <li key={index} className="exercise-item">
                    {exercise.name} - {exercise.sets} sets x {exercise.reps} reps
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClientDashboard;
