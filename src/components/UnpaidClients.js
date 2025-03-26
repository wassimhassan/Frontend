import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UnpaidClients.css";

const UnpaidClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUnpaidClients();
  }, []);

  const fetchUnpaidClients = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/unpaid-clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClients(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch unpaid clients.");
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (client) => {
    setSelectedClient(client);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const handleCashPayment = async () => {
    if (!selectedClient || !paymentAmount) {
      alert("Please select a client and enter a payment amount.");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/accept-cash-payment`,
        {
          clientId: selectedClient._id,
          amount: parseFloat(paymentAmount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the unpaid clients list
      fetchUnpaidClients();

      // Close the modal and reset states
      setShowPaymentModal(false);
      setSelectedClient(null);
      setPaymentAmount("");

      alert("Cash payment recorded successfully!");
    } catch (error) {
      console.error("Error processing cash payment:", error);
      alert(error.response?.data?.message || "Failed to process payment");
    }
  };

  return (
    <div className="unpaid-clients-container">
      <h1>Unpaid Clients</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {clients.length > 0 ? (
        <table className="unpaid-clients-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Balance Due ($)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id}>
                <td>{client.username}</td>
                <td>{client.email}</td>
                <td>${client.balanceDue.toFixed(2)}</td>
                <td>
                  <button 
                    className="payment-button"
                    onClick={() => handleOpenPaymentModal(client)}
                  >
                    Record Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No unpaid clients found.</p>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h2>Record Cash Payment</h2>
            <div className="payment-modal-content">
              <p>Client: {selectedClient.username}</p>
              <p>Current Balance Due: ${selectedClient.balanceDue.toFixed(2)}</p>
              
              <div className="payment-input-group">
                <label htmlFor="paymentAmount">Payment Amount:</label>
                <input
                  type="number"
                  id="paymentAmount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedClient.balanceDue}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter payment amount"
                />
              </div>

              {paymentAmount && (
                <div className="payment-preview">
                  <p>
                    Remaining Balance: $
                    {(selectedClient.balanceDue - parseFloat(paymentAmount)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="payment-modal-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-payment-button"
                  onClick={handleCashPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnpaidClients;