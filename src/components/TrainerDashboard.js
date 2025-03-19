import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import "./TrainerDashboard.css"; 

function TrainerDashboard() {
  const navigate = useNavigate(); // Hook for navigation

  // Mock data for booked clients
  const [clients, setClients] = useState([
    { id: 1, name: "John Doe", sessionDate: "2025-03-15", sessionTime: "10:00 AM" },
    { id: 2, name: "Jane Smith", sessionDate: "2025-03-16", sessionTime: "2:00 PM" },
    { id: 3, name: "Mike Johnson", sessionDate: "2025-03-17", sessionTime: "6:00 PM" }
  ]);

  // Function to navigate to AssignWorkout with client ID
  const handleAssignWorkout = (clientId) => {
    navigate(`/assign-workout?clientId=${clientId}`); // Pass clientId as query parameter
  };

  return (
    <div className="trainer-dashboard">
      <h2>Booked Clients</h2>

      {clients.length === 0 ? (
        <p>No clients have booked sessions yet.</p>
      ) : (
        <ul>
          {clients.map((client) => (
            <li 
              key={client.id} 
              className="client-card" 
              onClick={() => handleAssignWorkout(client.id)}
            >
              <strong>{client.name}</strong>
              <p>Date: {client.sessionDate}</p>
              <p>Time: {client.sessionTime}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TrainerDashboard;
