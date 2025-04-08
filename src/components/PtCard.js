import React, { useState, useEffect } from "react";
import "./ProfileCard.css";
import gymImage from "../assets/cam.jpg"; // Adjust path if needed

const PTCard = () => {
  const [trainerInfo, setTrainerInfo] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    experience: "",
    certifications: [],
    profilePicture: "",
    sex: ""
  });

  const [editing, setEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainerInfo();
  }, []);

  const fetchTrainerInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTrainerInfo(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trainer info:", error);
      setError("Failed to load trainer information");
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trainerInfo)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating trainer info:", error);
      alert("Failed to update profile");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/trainers/delete/${trainerInfo._id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        localStorage.removeItem("token");
        window.location.href = "/";
      } catch (error) {
        console.error("Error deleting trainer profile:", error);
        alert("Failed to delete profile");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (loading) return <div className="profile-container">Loading...</div>;
  if (error) return <div className="profile-container">{error}</div>;

  return (
    <div className="profile-container">
      {/* Profile Image with Clickable Button */}
      <div className="profile-img-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
        <img 
          src={trainerInfo.profilePicture || gymImage} 
          alt="Profile" 
          className="profile-img" 
        />

        {/* Dropdown Menu inside the Circle */}
        {showDropdown && (
          <div className="profile-dropdown">
            <button onClick={() => { setEditing(false); setShowDropdown(false); }}>View Profile</button>
            <button onClick={() => { setEditing(true); setShowDropdown(false); }}>Edit Profile</button>
            <button onClick={handleDelete} className="delete-btn">Delete Profile</button>
          </div>
        )}
      </div>

      {/* Profile Details */}
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-title">Personal Trainer Profile</h2>
          <span role="img" aria-label="fitness">🏋️‍♂️</span>
        </div>

        <div className="profile-details">
        {Object.entries(trainerInfo).map(([key, value]) => {
  if (key === "profilePicture" || key === "_id" || key === "__v" || 
      key === "availableSlots" || key === "clients" || 
      key === "rating" || key === "reviews") return null;
            return (
              <div key={key} className="profile-item">
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
                {editing ? (
                  key === "certifications" ? (
                    <input
                      type="text"
                      name={key}
                      value={value.join(", ")}
                      onChange={(e) => setTrainerInfo({ ...trainerInfo, [key]: e.target.value.split(",").map(item => item.trim()) })}
                      className="profile-input"
                    />
                  ) : (
                    <input
                      type={key === "email" ? "email" : "text"}
                      name={key}
                      value={value}
                      onChange={(e) => setTrainerInfo({ ...trainerInfo, [key]: e.target.value })}
                      className="profile-input"
                    />
                  )
                ) : (
                  <span>{Array.isArray(value) ? value.join(", ") : value}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="profile-actions">
          {editing ? (
            <button onClick={handleUpdate} className="save-btn">Save</button>
          ) : (
            <button onClick={() => setEditing(true)} className="edit-btn">Edit</button>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default PTCard;