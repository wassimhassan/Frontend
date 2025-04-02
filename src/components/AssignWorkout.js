import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AssignWorkout.css";

function AssignWorkout() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", rest: "" }]);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/trainers/trainer/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetched clients:", res.data);
        
        const clientArray = Array.isArray(res.data.clients) ? res.data.clients : res.data;
        setClients(clientArray);
      } catch (err) {
        console.error("Error fetching clients:", err.response?.data || err.message);
      }
    };

    fetchClients();
  }, [token]);

  // Fetch previously assigned workouts
  useEffect(() => {
    const fetchAssignedWorkouts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/workouts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignedWorkouts(res.data);
      } catch (err) {
        console.error("Error fetching workouts:", err.response?.data || err.message);
      }
    };

    fetchAssignedWorkouts();
  }, [token]);

  const handleSubmit = async () => {
    if (!selectedClient || !title.trim() || exercises.length === 0) {
      alert("Please fill in all fields and choose a client.");
      return;
    }

    const data = {
      title,
      description,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        rest: parseInt(ex.rest),
      })),
      assignedClients: [selectedClient],
    };

    try {
      await axios.post("http://localhost:5000/api/workouts", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert("✅ Workout Plan Assigned!");
      // Reset form
      setSelectedClient("");
      setTitle("");
      setDescription("");
      setExercises([{ name: "", sets: "", reps: "", rest: "" }]);

      // Re-fetch workouts
      const res = await axios.get("http://localhost:5000/api/workouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedWorkouts(res.data);
    } catch (err) {
      console.error("Error assigning workout", err.response?.data || err.message);
    }
  };

  return (
    <div className="workout-container">
      <h2>Assign Workout Plan</h2>

      <label>Select Client:</label>
      <select
        className="input-field"
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
      >
        <option value="">-- Select Client --</option>
        {clients.map((client) => (
          <option key={client._id} value={client._id}>
            {client.name}
          </option>
        ))}
      </select>

      <label>Workout Title:</label>
      <input
        className="input-field"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter workout title"
      />

      <label>Workout Description:</label>
      <textarea
        className="input-field"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter workout description"
      />

      <h4>Exercises</h4>
      {exercises.map((exercise, index) => (
        <div key={index} className="exercise-card">
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => {
              const updated = [...exercises];
              updated[index].name = e.target.value;
              setExercises(updated);
            }}
            placeholder="Exercise Name"
            className="input-field"
          />
          <input
            type="number"
            value={exercise.sets}
            onChange={(e) => {
              const updated = [...exercises];
              updated[index].sets = e.target.value;
              setExercises(updated);
            }}
            placeholder="Sets"
            className="input-field"
          />
          <input
            type="number"
            value={exercise.reps}
            onChange={(e) => {
              const updated = [...exercises];
              updated[index].reps = e.target.value;
              setExercises(updated);
            }}
            placeholder="Reps"
            className="input-field"
          />
          <input
            type="number"
            value={exercise.rest}
            onChange={(e) => {
              const updated = [...exercises];
              updated[index].rest = e.target.value;
              setExercises(updated);
            }}
            placeholder="Rest (sec)"
            className="input-field"
          />
        </div>
      ))}

      <button onClick={() => setExercises([...exercises, { name: "", sets: "", reps: "", rest: "" }])}>
        ➕ Add Exercise
      </button>

      <button onClick={handleSubmit} className="submit-btn">
        ASSIGN PLAN
      </button>

      <hr />

      <h3>📋 Previously Assigned Workouts</h3>
      <ul className="workout-list">
        {assignedWorkouts.length === 0 ? (
          <p>No workouts assigned yet.</p>
        ) : (
          assignedWorkouts.map((workout) => (
            <li key={workout._id}>
              <strong>{workout.title}</strong> - {workout.description}
              <ul>
                {workout.exercises.map((ex, i) => (
                  <li key={i}>
                    {ex.name} — {ex.sets} sets × {ex.reps} reps, Rest: {ex.rest}s
                  </li>
                ))}
              </ul>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default AssignWorkout;