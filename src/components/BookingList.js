import React from 'react';
import "../components/booking.css";

const BookingList = ({ bookings, onCancel }) => {
    return (
        <div className="booking-list">
            <h2>Your Bookings</h2>
            {bookings.length === 0 ? <p>No upcoming bookings.</p> : (
                <ul>
                    {bookings.map((booking, index) => (
                        <li key={index}>
                            {booking.trainer} - {booking.date} at {booking.time}
                            <button onClick={() => onCancel(index)}>Cancel</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BookingList;
