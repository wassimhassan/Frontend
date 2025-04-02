import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AISuggestions.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AISuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const fetchSuggestions = async () => {
    if (!token) {
      setError('No authentication token found. Please log in first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/ai/ai-suggestions`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setSuggestions(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch AI suggestions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only trigger the PDF or screenshot generation when the suggestions are available
    if (suggestions.length > 0) {
      console.log("Suggestions are available");
    }
  }, [suggestions]);

  // Function to generate PDF
  const generatePDF = () => {
    const input = document.getElementById('workout-plan');
    if (input) {
        html2canvas(input).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF();
          pdf.addImage(imgData, 'PNG', 10, 10, 180, 250); // Adjust width and height as needed
          pdf.save('workout-plan.pdf');
        });
      } else {
        console.error('Error: The element to capture does not exist.');
      }
    };

  return (
  <div className="workout-container">
    <h2 className="title">Your Personalized Workout and Nutrition Plan</h2>

    {/* Add the id to this container */}
    <div id="workout-plan" className="day-container">
      {suggestions && suggestions.length > 0 && suggestions.map((suggestion, index) => (
        <div key={index} className="day-card">
          <div className="workout-plan">
            <h4>Workout Plan</h4>
            <ul>
              {suggestion.workout && suggestion.workout.split('\n').map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="nutrition-plan">
            <h4>Nutrition Plan</h4>
            <ul>
              {suggestion.nutrition && suggestion.nutrition.split('\n').map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>

    {/* Rest of your component remains the same */}
    <button 
      onClick={fetchSuggestions}
      disabled={loading || !token}
      className={`action-button ${loading || !token ? 'disabled' : ''}`}
    >
      {loading ? 'Loading Suggestions...' : 'Get AI Suggestions'}
    </button>

    <div className="download-buttons">
      <button 
        onClick={generatePDF} 
        className="action-button"
        disabled={loading || !suggestions.length}
      >
        Download as PDF
      </button>
    </div>

    {error && (
      <div className="error-message">
        <p>{error}</p>
      </div>
    )}
  </div>
);
};

export default AISuggestions;
