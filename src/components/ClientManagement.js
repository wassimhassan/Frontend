// components/ClientManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientManagement.css';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClient = async (clientId) => {
    if (window.confirm("Are you sure you want to remove this client?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients/remove/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Client removed successfully!");
        fetchClients();
      } catch (error) {
        console.error("Error removing client:", error);
        alert(error.response?.data?.message || "Failed to remove client.");
      }
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newClientId.trim()) {
      setError('Please enter a valid client ID');
      return;
    }
    
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients/add/${newClientId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Client added successfully!");
      setShowAddClientModal(false);
      setNewClientId('');
      fetchClients();
    } catch (error) {
      console.error("Error adding client:", error);
      setError(error.response?.data?.message || "Failed to add client. Make sure the client ID is valid.");
    }
  };

  const filteredClients = clients.filter(client => 
    client.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.phoneNumber?.includes(searchTerm)
  );

  return (
    <>
      <div className="client-management-container">
        <div className="client-management-header">
          <h1>Client Management</h1>
          <div className="client-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="add-client-btn"
              onClick={() => setShowAddClientModal(true)}
            >
              Add New Client
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading clients...</div>
        ) : (
          <div className="clients-table-container">
            {filteredClients.length > 0 ? (
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client._id}>
                      <td>{client.username}</td>
                      <td>{client.phoneNumber}</td>
                      <td>
                        <span className={`status-badge ${client.isActive ? 'active' : 'inactive'}`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="view-client-btn"
                          onClick={() => alert(`View client profile for ${client.username}`)}
                        >
                          View
                        </button>
                        <button 
                          className="remove-client-btn"
                          onClick={() => handleRemoveClient(client._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-clients">
                <p>No clients found. {searchTerm ? 'Try a different search term.' : 'Add a client to get started.'}</p>
              </div>
            )}
          </div>
        )}

        {/* Add Client Modal */}
        {showAddClientModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Add Client</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleAddClient}>
                <div className="form-group">
                  <label>Client ID</label>
                  <input
                    type="text"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="Enter client ID"
                    required
                  />
                  <small>Enter the unique ID of an existing client in the system</small>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddClientModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientManagement;