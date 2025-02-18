import React, { useState } from "react";
import "./ProfileCard.css";
import gymImage from "../assets/cam.jpg"; // Adjust path if needed

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
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="profile-container">
      {/* Profile Image with Clickable Button */}
      <div className="profile-img-wrapper" onClick={toggleDropdown}>
  <img src={gymImage} alt="Profile" className="profile-img" />

  {/* Dropdown Menu inside the Circle */}
  {showDropdown && (
    <div className="profile-dropdown">
      <button onClick={() => { setEditing(false); setShowDropdown(false); }}> View Profile</button>
      <button onClick={() => { setEditing(true); setShowDropdown(false); }}> Edit Profile</button>
    </div>
  )}
</div>


      {/* Profile Details */}
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
                  value={userInfo[key]}
                  onChange={(e) => setUserInfo({ ...userInfo, [e.target.name]: e.target.value })}
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
            <button onClick={() => setEditing(false)} className="save-btn">Save</button>
          ) : (
            <button onClick={() => setEditing(true)} className="edit-btn">Edit</button>
          )}
          <button className="logout-btn">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
