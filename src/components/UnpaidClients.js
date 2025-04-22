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
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/gym-owner/accept-cash-payment`,
            {
                clientId: selectedClient._id,
                amount: parseFloat(paymentAmount),
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Close the modal first
        setShowPaymentModal(false);
        setSelectedClient(null);
        setPaymentAmount("");

        // Update the clients list with the new balance
        setClients(prevClients => {
            const updatedClients = prevClients.map(client => {
                if (client._id === response.data.client._id) {
                    return {
                        ...client,
                        balanceDue: response.data.client.balanceDue
                    };
                }
                return client;
            }).filter(client => client.balanceDue > 0); // Remove clients with zero balance

            return updatedClients;
        });

        // Fetch updated data after a short delay
        setTimeout(() => {
            fetchUnpaidClients();
        }, 500);

        alert("Cash payment recorded successfully!");
    } catch (error) {
        console.error("Error processing cash payment:", error);
        alert(error.response?.data?.message || "Failed to process payment");
    }
};

  return (
    <div className="unpaid-container">
      <h1 className="unpaid-title">Unpaid Clients</h1>

      {loading && <p className="unpaid-loading">Loading...</p>}
      {error && <p className="unpaid-error">{error}</p>}

      {clients.length > 0 ? (
        <table className="unpaid-table">
          <thead>
            <tr className="unpaid-header-row">
              <th className="unpaid-header-cell">Client Name</th>
              <th className="unpaid-header-cell">Email</th>
              <th className="unpaid-header-cell">Balance Due ($)</th>
              <th className="unpaid-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id} className="unpaid-row">
                <td className="unpaid-cell">{client.username}</td>
                <td className="unpaid-cell">{client.email}</td>
                <td className="unpaid-cell unpaid-balance">${client.balanceDue.toFixed(2)}</td>
                <td className="unpaid-cell">
                  <button 
                    className="unpaid-payment-btn"
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
        <p className="unpaid-empty">No unpaid clients found.</p>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="unpaid-modal-overlay">
          <div className="unpaid-modal">
            <h2 className="unpaid-modal-title">Record Cash Payment</h2>
            <div className="unpaid-modal-content">
              <p className="unpaid-modal-info">Client: {selectedClient.username}</p>
              <p className="unpaid-modal-info">Current Balance Due: ${selectedClient.balanceDue.toFixed(2)}</p>
              
              <div className="unpaid-input-group">
                <label htmlFor="paymentAmount" className="unpaid-input-label">Payment Amount:</label>
                <input
                  type="number"
                  id="paymentAmount"
                  className="unpaid-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedClient.balanceDue}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter payment amount"
                />
              </div>

              {paymentAmount && (
                <div className="unpaid-preview">
                  <p className="unpaid-remaining-balance">
                    Remaining Balance: $
                    {(selectedClient.balanceDue - parseFloat(paymentAmount || 0)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="unpaid-modal-actions">
                <button 
                  className="unpaid-cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="unpaid-confirm-btn"
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