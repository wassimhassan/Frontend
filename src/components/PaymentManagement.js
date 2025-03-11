// components/PaymentManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    amount: '',
    method: 'cash'
  });

  // Stripe payment form state
  const [stripePayment, setStripePayment] = useState({
    amount: '',
    currency: 'usd',
    description: 'Gym membership payment'
  });

  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsResponse, clientsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/payment`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      setPayments(paymentsResponse.data);
      setClients(clientsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    
    if (formType === 'regular') {
      setNewPayment({
        ...newPayment,
        [name]: name === 'amount' ? parseFloat(value) || '' : value
      });
    } else if (formType === 'stripe') {
      setStripePayment({
        ...stripePayment,
        [name]: name === 'amount' ? parseFloat(value) || '' : value
      });
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/payment/add`, newPayment, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Payment recorded successfully!");
      setShowAddPaymentModal(false);
      setNewPayment({
        clientId: '',
        amount: '',
        method: 'cash'
      });
      fetchData();
    } catch (error) {
      console.error("Error adding payment:", error);
      setError(error.response?.data?.message || "Failed to record payment.");
    }
  };

  const handleProcessStripePayment = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/payment/stripe`, stripePayment);
      
      alert("Stripe payment processed successfully!");
      console.log("Stripe payment response:", response.data);
      setShowStripeModal(false);
      setStripePayment({
        amount: '',
        currency: 'usd',
        description: 'Gym membership payment'
      });
      fetchData();
    } catch (error) {
      console.error("Error processing Stripe payment:", error);
      setError(error.response?.data?.message || "Failed to process Stripe payment.");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        await axios.delete(`http://localhost:5000/api/payment/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Payment record deleted successfully!");
        fetchData();
      } catch (error) {
        console.error("Error deleting payment:", error);
        alert(error.response?.data?.message || "Failed to delete payment record.");
      }
    }
  };

  // Filter payments by date range
  const filteredPayments = payments.filter(payment => {
    if (!filterDateFrom && !filterDateTo) return true;
    
    const paymentDate = new Date(payment.paymentDate);
    
    if (filterDateFrom && !filterDateTo) {
      return paymentDate >= new Date(filterDateFrom);
    }
    
    if (!filterDateFrom && filterDateTo) {
      return paymentDate <= new Date(filterDateTo);
    }
    
    return paymentDate >= new Date(filterDateFrom) && paymentDate <= new Date(filterDateTo);
  });

  return (
    <>
      <div className="payment-management-container">
        <div className="payment-management-header">
          <h1>Payment Management</h1>
          <div className="payment-actions">
            <div className="date-filters">
              <div className="date-filter">
                <label>From:</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div className="date-filter">
                <label>To:</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button 
                className="clear-filter-btn"
                onClick={() => {
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <button className="add-payment-btn" onClick={() => setShowAddPaymentModal(true)}>
            ➕ Add Payment
          </button>
          <button className="stripe-payment-btn" onClick={() => setShowStripeModal(true)}>
            💳 Process Stripe Payment
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="payments-list">
        {filteredPayments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount ($)</th>
                <th>Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const client = clients.find((c) => c._id === payment.clientId);
                return (
                  <tr key={payment._id}>
                    <td>{client ? client.username : 'Unknown'}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>{payment.method}</td>
                    <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeletePayment(payment._id)}
                      >
                        ❌ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No payments found for the selected date range.</p>
        )}
      </div>
    </div>

    {/* Add Payment Modal */}
    {showAddPaymentModal && (
      <div className="modal">
        <div className="modal-content">
          <h2>Add New Payment</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleAddPayment}>
            <label>Client:</label>
            <select
              name="clientId"
              value={newPayment.clientId}
              onChange={(e) => handleInputChange(e, 'regular')}
              required
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.username}
                </option>
              ))}
            </select>

            <label>Amount ($):</label>
            <input
              type="number"
              name="amount"
              value={newPayment.amount}
              onChange={(e) => handleInputChange(e, 'regular')}
              required
            />

            <label>Payment Method:</label>
            <select
              name="method"
              value={newPayment.method}
              onChange={(e) => handleInputChange(e, 'regular')}
              required
            >
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            <div className="modal-buttons">
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setShowAddPaymentModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Stripe Payment Modal */}
    {showStripeModal && (
      <div className="modal">
        <div className="modal-content">
          <h2>Process Stripe Payment</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleProcessStripePayment}>
            <label>Amount ($):</label>
            <input
              type="number"
              name="amount"
              value={stripePayment.amount}
              onChange={(e) => handleInputChange(e, 'stripe')}
              required
            />

            <label>Currency:</label>
            <select
              name="currency"
              value={stripePayment.currency}
              onChange={(e) => handleInputChange(e, 'stripe')}
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>

            <label>Description:</label>
            <input
              type="text"
              name="description"
              value={stripePayment.description}
              onChange={(e) => handleInputChange(e, 'stripe')}
            />

            <div className="modal-buttons">
              <button type="submit">Process Payment</button>
              <button type="button" onClick={() => setShowStripeModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
};

export default PaymentManagement;
