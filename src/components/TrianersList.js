// src/components/TrainersList.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TrainersList = () => {
  const [trainers, setTrainers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/trainers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setTrainers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching trainers:", error);
      });
  }, [token]);

  return (
    <div>
      <h2>Available Trainers</h2>
      <ul>
        {trainers.map((trainer) => (
          <li key={trainer._id} style={{ marginBottom: "10px" }}>
            <span>{trainer.username}</span>
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => {
                // Navigate to the chat route with the trainer's _id as the parameter
                navigate(`/chat/${trainer._id}`);
              }}
            >
              Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrainersList;
