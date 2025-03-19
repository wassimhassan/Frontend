import React, { useState } from "react";
import "./WorkoutPlan.css"; // Ensure the CSS file exists

function WorkoutPlan() {
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", rest: "" }]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", rest: "" }]);
  };

  const handleRemoveExercise = (index) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
  };

  const handleChange = (index, field, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[index][field] = value;
    setExercises(updatedExercises);
  };

  const handleSubmit = () => {
    console.log("Workout Plan Created:", { workoutTitle, exercises });
    alert("Workout Plan Created!");
  };

  return (
    <div className="workout-container">
      <h2>Create Workout Plan</h2>
      
      <label>Workout Plan Title:</label>
      <input 
        type="text" 
        value={workoutTitle} 
        onChange={(e) => setWorkoutTitle(e.target.value)} 
        placeholder="Enter workout title" 
        className="input-field"
      />

      <div className="exercise-list">
        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-card">
            <label>Exercise Name:</label>
            <input 
              type="text" 
              value={exercise.name} 
              onChange={(e) => handleChange(index, "name", e.target.value)} 
              placeholder="Exercise name"
              className="input-field"
            />

            <label>Sets:</label>
            <input 
              type="number" 
              value={exercise.sets} 
              onChange={(e) => handleChange(index, "sets", e.target.value)} 
              placeholder="Number of sets"
              className="input-field"
            />

            <label>Reps:</label>
            <input 
              type="number" 
              value={exercise.reps} 
              onChange={(e) => handleChange(index, "reps", e.target.value)} 
              placeholder="Number of reps"
              className="input-field"
            />

            <label>Rest Time (sec):</label>
            <input 
              type="number" 
              value={exercise.rest} 
              onChange={(e) => handleChange(index, "rest", e.target.value)} 
              placeholder="Rest time in seconds"
              className="input-field"
            />

            <button className="remove-btn" onClick={() => handleRemoveExercise(index)}>Remove</button>
          </div>
        ))}
      </div>

      <button className="add-btn" onClick={handleAddExercise}>Add Exercise</button>
      <button className="submit-btn" onClick={handleSubmit}>Save Workout Plan</button>
    </div>
  );
}

export default WorkoutPlan;
