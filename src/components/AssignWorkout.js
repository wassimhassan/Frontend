import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AssignWorkout.css";

function AssignWorkout() {
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
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

  const handleClientSelect = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedClients.length === 0 || !title.trim() || exercises.length === 0) {
      alert("Please fill in all fields and choose at least one client.");
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
      assignedClients: selectedClients,
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
      setSelectedClients([]);
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
    <div className="assign-workout">
      <h2>Assign Workout Plan</h2>
      
      <div className="clients-section">
        <h3>
          Select Clients 
          {selectedClients.length > 0 && (
            <span className="selected-count">
              {selectedClients.length} selected
            </span>
          )}
        </h3>
        <div className="clients-grid">
          {clients.map(client => (
            <div 
              key={client._id} 
              className={`client-card ${selectedClients.includes(client._id) ? 'selected' : ''}`}
              onClick={() => handleClientSelect(client._id)}
            >
              <div className="client-info">
                <h4>{client.username}</h4>
                <p>Email: {client.email}</p>
                {client.lastSession && (
                  <p>Last Session: {new Date(client.lastSession).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  );
}

export default AssignWorkout;