import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WorkoutPlan.css";

const WorkoutPlan = () => {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [token] = useState(localStorage.getItem("token"));
  const [userId] = useState(localStorage.getItem("userId"));

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [formMode, setFormMode] = useState("create"); // or "edit"
  const [editingPlanId, setEditingPlanId] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", rest: "" }]);

  // Fetch clients for trainer
  useEffect(() => {
    if (role === "trainer") {
      axios
        .get("http://localhost:5000/api/trainers/trainer/clients", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setClients(res.data || []))
        .catch((err) => console.error("Error fetching clients", err));
    }
  }, [role, token]);

  // Fetch plans based on role
  useEffect(() => {
    if (!token || !userId) return;

    axios
      .get("http://localhost:5000/api/workouts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (role === "trainer" && selectedClient) {
          const filtered = res.data.filter((plan) =>
            plan.assignedClients.includes(selectedClient._id)
          );
          setPlans(filtered);
        } else if (role === "client") {
          const filtered = res.data.filter((plan) =>
            plan.assignedClients.includes(userId)
          );
          setPlans(filtered);
        }
      })
      .catch((err) => console.error("Error fetching plans", err));
  }, [role, selectedClient, token, userId]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", rest: "" }]);
  };

  const handleChangeExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/workouts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(plans.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error deleting plan", err);
    }
  };

  const handleEditPlan = (plan) => {
    setFormMode("edit");
    setEditingPlanId(plan._id);
    setTitle(plan.title);
    setDescription(plan.description);
    setExercises(plan.exercises);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return alert("Title required");

    const data = {
      title,
      description,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        rest: parseInt(ex.rest),
      })),
      assignedClients: selectedClient ? [selectedClient._id] : [],
    };

    try {
      if (formMode === "edit") {
        await axios.put(`http://localhost:5000/api/workouts/${editingPlanId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Workout updated");
      } else {
        await axios.post("http://localhost:5000/api/workouts", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Workout created");
      }

      // Reset form
      setFormMode("create");
      setEditingPlanId(null);
      setTitle("");
      setDescription("");
      setExercises([{ name: "", sets: "", reps: "", rest: "" }]);

      // Trigger refresh
      setSelectedClient({ ...selectedClient });
    } catch (err) {
      console.error("Error submitting", err.response?.data || err.message);
    }
  };

  return (
    <div className="workout-container">
      <h2>Workout Plans</h2>

      {role === "trainer" && (
        <div>
          <h3>Your Clients:</h3>
          {clients.map((client) => (
            <button key={client._id} onClick={() => setSelectedClient(client)}>
              {client.name}
            </button>
          ))}
        </div>
      )}

      {role === "trainer" && selectedClient && (
        <>
          <h3>Plans for {selectedClient.name}</h3>
          <button onClick={() => setFormMode("create")}>➕ Create Plan</button>
        </>
      )}

      {plans.map((plan) => (
        <div key={plan._id} className="plan-card">
          <h4>{plan.title}</h4>
          <p>{plan.description}</p>
          <ul>
            {plan.exercises.map((ex, idx) => (
              <li key={idx}>
                {ex.name} – {ex.sets}x{ex.reps} (Rest: {ex.rest}s)
              </li>
            ))}
          </ul>
          {role === "trainer" && (
            <>
              <button onClick={() => handleEditPlan(plan)}>✏️ Edit</button>
              <button onClick={() => handleDeletePlan(plan._id)}>🗑️ Delete</button>
            </>
          )}
        </div>
      ))}

      {/* Trainer Form */}
      {role === "trainer" && selectedClient && (
        <div className="plan-form">
          <h3>{formMode === "edit" ? "Edit Plan" : "Create Plan"}</h3>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Plan title"
            className="input-field"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="input-field"
            rows={3}
          />

          {exercises.map((ex, index) => (
            <div key={index} className="exercise-card">
              <input
                type="text"
                value={ex.name}
                onChange={(e) => handleChangeExercise(index, "name", e.target.value)}
                placeholder="Exercise"
              />
              <input
                type="number"
                value={ex.sets}
                onChange={(e) => handleChangeExercise(index, "sets", e.target.value)}
                placeholder="Sets"
              />
              <input
                type="number"
                value={ex.reps}
                onChange={(e) => handleChangeExercise(index, "reps", e.target.value)}
                placeholder="Reps"
              />
              <input
                type="number"
                value={ex.rest}
                onChange={(e) => handleChangeExercise(index, "rest", e.target.value)}
                placeholder="Rest"
              />
            </div>
          ))}

          <button onClick={handleAddExercise}>➕ Add Exercise</button>
          <button onClick={handleSubmit}>
            {formMode === "edit" ? "Update Plan" : "Save Plan"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlan;