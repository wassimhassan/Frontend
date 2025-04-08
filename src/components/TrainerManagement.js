import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrainerManagement.css';

const TrainerManagement = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    experience: '',
    certifications: '',
    sex: 'male'
  });
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainers`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTrainers(response.data);
    } catch (err) {
      setError('Failed to fetch trainers');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/trainers/trainer/signup`,
        {
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          specialization: formData.specialization,
          experience: formData.experience,
          certifications: formData.certifications.split(',').map(cert => cert.trim()),
          sex: formData.sex
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Trainer account created successfully!');
      setFormData({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        specialization: '',
        experience: '',
        certifications: '',
        sex: 'male'
      });
      fetchTrainers(); // Refresh the trainers list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trainer account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${process.env.REACT_APP_BACKEND_URL}/api/trainers/delete/${trainerId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSuccess('Trainer deleted successfully!');
        fetchTrainers(); // Refresh the trainers list
      } catch (err) {
        setError('Failed to delete trainer');
      }
    }
  };

  return (
    <div className="trainer-management">
      <h2>Trainer Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="trainer-management-grid">
        <div className="create-trainer-section">
          <h3>Create New Trainer</h3>
          <form onSubmit={handleSubmit} className="trainer-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Certifications (comma-separated)</label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="e.g., NASM, ACE, CrossFit"
              />
            </div>

            <div className="form-group">
              <label>Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Trainer Account'}
            </button>
          </form>
        </div>

        <div className="trainers-list-section">
          <h3>Existing Trainers</h3>
          {trainers.length === 0 ? (
            <p className="empty-state">No trainers found.</p>
          ) : (
            <div className="trainers-grid">
              {trainers.map((trainer) => (
                <div key={trainer._id} className="trainer-card">
                  <div className="trainer-info">
                    <h4>{trainer.username}</h4>
                    <p><strong>Email:</strong> {trainer.email}</p>
                    <p><strong>Phone:</strong> {trainer.phoneNumber}</p>
                    <p><strong>Specialization:</strong> {trainer.specialization}</p>
                    <p><strong>Experience:</strong> {trainer.experience} years</p>
                    <p><strong>Certifications:</strong> {trainer.certifications?.join(', ') || 'None'}</p>
                    <p><strong>Sex:</strong> {trainer.sex}</p>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteTrainer(trainer._id)}
                  >
                    Delete Trainer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerManagement; 