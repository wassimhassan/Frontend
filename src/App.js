import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ProfileCard from "./components/ProfileCard";
import ResetPassword from "./components/ResetPassword";
import BookingsForm from "./components/BookingForm";
import BookingList from './components/BookingList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfileCard />} />
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/book" element={<BookingsForm />} />
      </Routes>
    </Router>
  );
}

export default App;