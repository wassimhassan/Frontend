import React, { useState } from 'react';
import "../components/booking.css";

const BookingForm = ({ onBook }) => {
    const [trainer, setTrainer] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onBook({ trainer, date, time });
        } catch (err) {
            setError('Failed to book session');
        }
        setLoading(false);
    };

    return (
        <div className="booking-container">
            <h2>Book a Session</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <select value={trainer} onChange={(e) => setTrainer(e.target.value)} required>
                    <option value="">Select Trainer</option>
                    <option value="John">John</option>
                    <option value="Sarah">Sarah</option>
                </select>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? 'Booking...' : 'Book Now'}</button>
            </form>
        </div>
    );
};

export default BookingForm;
