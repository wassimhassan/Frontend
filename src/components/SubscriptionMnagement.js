import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionManagement.css';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const [newSubscription, setNewSubscription] = useState({
    clientId: '',
    planType: 'basic',
    endDate: '',
    amountPaid: '',
    method: 'cash',
    transactionId: '',
  });

  const [renewSubscription, setRenewSubscription] = useState({
    endDate: '',
    amountPaid: '',
    method: 'cash',
    transactionId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subscriptionsResponse, clientsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSubscriptions(subscriptionsResponse.data);
      setClients(clientsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, type) => {
    const { name, value } = e.target;
    if (type === 'new') {
      setNewSubscription({ ...newSubscription, [name]: value });
    } else {
      setRenewSubscription({ ...renewSubscription, [name]: value });
    }
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/subscriptions/add`, newSubscription, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Subscription added successfully!');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding subscription:', error);
      setError(error.response?.data?.message || 'Failed to add subscription.');
    }
  };

  const handleCancelSubscription = async (id) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await axios.put(`http://localhost:5000/api/subscriptions/cancel/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Subscription canceled successfully!');
        fetchData();
      } catch (error) {
        console.error('Error canceling subscription:', error);
      }
    }
  };

  const handleRenewSubscription = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(`http://localhost:5000/api/subscriptions/renew/${selectedSubscription._id}`, renewSubscription, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Subscription renewed successfully!');
      setShowRenewModal(false);
      fetchData();
    } catch (error) {
      console.error('Error renewing subscription:', error);
      setError(error.response?.data?.message || 'Failed to renew subscription.');
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    filterStatus ? sub.status === filterStatus : true
  );

  return (
    <>
      <div className="subscription-management-container">
        <h1>Subscription Management</h1>

        {/* Filters */}
        <div className="subscription-actions">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="canceled">Canceled</option>
          </select>

          <button className="add-subscription-btn" onClick={() => setShowAddModal(true)}>
            ➕ Add Subscription
          </button>
        </div>

        {/* Subscriptions List */}
        <div className="subscriptions-list">
          {filteredSubscriptions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Plan Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => {
                  const client = clients.find((c) => c._id === sub.clientId);
                  return (
                    <tr key={sub._id}>
                      <td>{client ? client.username : 'Unknown'}</td>
                      <td>{sub.planType}</td>
                      <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                      <td>{sub.status}</td>
                      <td>
                        {sub.status === 'active' && (
                          <button className="cancel-btn" onClick={() => handleCancelSubscription(sub._id)}>
                            ❌ Cancel
                          </button>
                        )}
                        {sub.status !== 'active' && (
                          <button
                            className="renew-btn"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowRenewModal(true);
                            }}
                          >
                            🔄 Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>No subscriptions found.</p>
          )}
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Subscription</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleAddSubscription}>
              <label>Client:</label>
              <select name="clientId" onChange={(e) => handleInputChange(e, 'new')} required>
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.username}
                  </option>
                ))}
              </select>

              <label>Plan Type:</label>
              <select name="planType" onChange={(e) => handleInputChange(e, 'new')} required>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>

              <label>End Date:</label>
              <input type="date" name="endDate" onChange={(e) => handleInputChange(e, 'new')} required />

              <label>Amount Paid ($):</label>
              <input type="number" name="amountPaid" onChange={(e) => handleInputChange(e, 'new')} required />

              <button type="submit">Submit</button>
              <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Renew Subscription</h2>
            <form onSubmit={handleRenewSubscription}>
              <label>New End Date:</label>
              <input type="date" name="endDate" onChange={(e) => handleInputChange(e, 'renew')} required />

              <button type="submit">Renew</button>
              <button type="button" onClick={() => setShowRenewModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionManagement;
