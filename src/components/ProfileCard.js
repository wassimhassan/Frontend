import React, { useState } from "react";
import "./ProfileCard.css";

const ProfileCard = () => {
  const [userInfo, setUserInfo] = useState({
    height: "180 cm",
    weight: "75 kg",
    plan: "Premium Membership",
    goal: "Muscle Gain",
    email: "user@example.com",
    phone: "+123 456 7890",
  });

  const [editing, setEditing] = useState(false);
  const [updatedInfo, setUpdatedInfo] = useState(userInfo);

  const handleChange = (e) => {
    setUpdatedInfo({ ...updatedInfo, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setUserInfo(updatedInfo);
    setEditing(false);
  };

  return (
    <div className="profile-container">
      {/* Profile Image Container */}
      <div className="profile-img-wrapper">
        <img
          src="gym.jpg" // Replace with actual image
          alt="Profile"
          className="profile-img"
        />
      </div>

      {/* Profile Details Card */}
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-title">Member Profile</h2>
          <span role="img" aria-label="fitness">💪</span>
        </div>

        <div className="profile-details">
          {Object.keys(userInfo).map((key) => (
            <div key={key} className="profile-item">
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>
              {editing ? (
                <input
                  type="text"
                  name={key}
                  value={updatedInfo[key]}
                  onChange={handleChange}
                  className="profile-input"
                />
              ) : (
                <span> {userInfo[key]}</span>
              )}
            </div>
          ))}
        </div>

        <div className="profile-actions">
          {editing ? (
            <button onClick={handleSave} className="save-btn">Save</button>
          ) : (
            <button onClick={() => setEditing(true)} className="edit-btn">Edit</button>
          )}
          <button className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Membership Status */}
      <p className="profile-status active">● Active Membership</p>
    </div>
  );
};

export default ProfileCard;