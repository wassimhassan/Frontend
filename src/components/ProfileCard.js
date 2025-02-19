import React, { useState, useEffect, useRef } from "react";
import "./ProfileCard.css";
import gymImage from "../assets/cam.jpg"; // Or your default profile image

const API_BASE_URL = "http://localhost:5000/api"; // Change if using a different port or domain

const ProfileCard = () => {
  const [userInfo, setUserInfo] = useState(null);   // Will hold the user data from backend
  const [editing, setEditing] = useState(false);
  const [updatedInfo, setUpdatedInfo] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const handleFileChangeAndUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found. Please log in.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await fetch(`http://localhost:5000/api/auth/upload-profile-picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      alert("Profile picture uploaded successfully!");
      setUserInfo((prevUserInfo) => ({
        ...prevUserInfo,
        profilePicture: data.profilePicture, // Update UI
      }));
    } else {
      alert(data.message || "Failed to upload profile picture");
    }
  };

  // 1️⃣ Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          setLoading(false);
          return;
        }

        // Fetch User Profile
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          console.log("Fetched user profile:", data);
          setUserInfo(data);
          setUpdatedInfo(data);
        } else {
          console.error("Error fetching profile:", data.message);
        }

        // Fetch Profile Picture Separately
        const picResponse = await fetch(`${API_BASE_URL}/auth/profile-picture`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const picData = await picResponse.json();
        if (picResponse.ok) {
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            profilePicture: picData.profilePicture, // Assign the fetched profile picture
          }));
        } else {
          console.error("Error fetching profile picture:", picData.message);
        }

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const deleteProfilePicture = async () => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete your profile picture?");
      if (!confirmDelete) return;

      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/remove-profile-picture`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("Profile picture removed successfully!");
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          profilePicture: "/uploads/cam.jpg", // Reset to default
        }));
      } else {
        alert(data.message || "Failed to delete profile picture");
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    }
  };



  // 2️⃣ Handle input changes in edit mode
  const handleChange = (e) => {
    setUpdatedInfo({
      ...updatedInfo,
      [e.target.name]: e.target.value,
    });
  };


  // 3️⃣ Save updated profile to backend (PUT /api/auth/profile)
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Only send the fields we want to update
        body: JSON.stringify({
          // If you changed your route to expect `username` instead of `name`, do:
          username: updatedInfo.username,

          // If your route is expecting `name`, do:
          // name: updatedInfo.name,

          height: updatedInfo.height,
          weight: updatedInfo.weight,
          dateOfBirth: updatedInfo.dateOfBirth,
          phoneNumber: updatedInfo.phoneNumber,
          workoutDaysPerWeek: updatedInfo.workoutDaysPerWeek,
          goal: updatedInfo.goal,
          sex: updatedInfo.sex,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
        // data.user is the updated user from the backend
        setUserInfo(data.user);
        setUpdatedInfo(data.user);
        setEditing(false);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // 4️⃣ Logout: remove token & redirect
  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out successfully");
    window.location.href = "/login";
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const openImageModal = () => {
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  if (loading) return <p>Loading profile...</p>;
  if (!userInfo) return <p>No profile data available.</p>;

  // These are the fields you want to display & edit. 
  // Make sure they match your schema & your route logic.
  const fieldsToShow = [
    "username",       // or name if your route uses "name"
    "email",
    "phoneNumber",
    "height",
    "weight",
    "workoutDaysPerWeek",
    "goal",
    "sex",
    "dateOfBirth"
  ];



  return (
    <div className="profile-container">
      {/* Profile Image with Clickable Button */}
      <div className="profile-img-wrapper" onClick={toggleDropdown}>
        {/* If the user has a profilePicture field, display it; otherwise fallback */}
        <img
          src={userInfo.profilePicture ? `http://localhost:5000${userInfo.profilePicture}` : gymImage}
          alt="Profile"
          className="profile-img"
        />

        {showDropdown && (
          <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              setEditing(false);
              setShowDropdown(false);
              openImageModal();
            }}>
              View Profile
            </button>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChangeAndUpload}
            />

            {/* Button to trigger file input */}
            <button onClick={() => fileInputRef.current.click()} className="upload-btn">
              Change Profile Picture
            </button>

            <button onClick={deleteProfilePicture} className="delete-btn">
              Delete Picture
            </button>
          </div>
        )}
        {/* Modal for Viewing Profile */}
        {imageModalOpen && (
          <div className="image-modal">
            <div className="modal-content">
              <span className="close-modal" onClick={closeImageModal}>&times;</span>
              <img src={userInfo?.profilePicture ? `http://localhost:5000${userInfo.profilePicture}` : gymImage} alt="Profile" />
            </div>
          </div>
        )}

      </div>
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-title">Member Profile</h2>
          <span role="img" aria-label="fitness">💪</span>
        </div>

        <div className="profile-details">
          {fieldsToShow.map((field) => {
            // Special handling for "dateOfBirth"
            if (field === "dateOfBirth") {
              return (
                <div key={field} className="profile-item">
                  <strong>Date of Birth:</strong>
                  {editing ? (
                    // Use <input type="date" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      // Convert ISO or stored date to YYYY-MM-DD
                      value={
                        updatedInfo.dateOfBirth
                          ? updatedInfo.dateOfBirth.substring(0, 10)
                          : ""
                      }
                      onChange={handleChange}
                      className="profile-input"
                    />
                  ) : (
                    <span>
                      {" "}
                      {userInfo.dateOfBirth
                        ? new Date(userInfo.dateOfBirth).toLocaleDateString()
                        : "Not set"}
                    </span>
                  )}
                </div>
              );
            } else {
              return (
                <div key={field} className="profile-item">
                  <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{" "}
                  {field === "sex" ? (
                    editing ? (
                      <select
                        name="sex"
                        value={updatedInfo.sex || ""}
                        onChange={handleChange}
                        className="profile-input"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    ) : (
                      <span>{userInfo.sex ? userInfo.sex.charAt(0).toUpperCase() + userInfo.sex.slice(1) : "Not set"}</span>
                    )
                  ) : field === "username" || field === "email" ? (
                    <span>{userInfo[field] !== undefined ? " " + userInfo[field] : " Not set"}</span>
                  ) : editing ? (
                    <input
                      type="text"
                      name={field}
                      value={updatedInfo[field] !== undefined ? updatedInfo[field] : ""}
                      onChange={handleChange}
                      className="profile-input"
                    />
                  ) : (
                    <span>{userInfo[field] !== undefined ? " " + userInfo[field] : " Not set"}</span>
                  )}

                </div>
              );
            }
          })}
        </div>

        <div className="profile-actions">
          {editing ? (
            <button onClick={handleSave} className="save-btn">
              Save
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="edit-btn">
              Edit
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
