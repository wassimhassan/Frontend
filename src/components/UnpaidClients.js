import React, { useEffect, useState } from "react";
import axios from "axios";

const UnpaidClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id}>
                <td>{client.username}</td>
                <td>{client.email}</td>
                <td>${client.balanceDue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No unpaid clients found.</p>
      )}
    </div>
  );
};

export default UnpaidClients;
