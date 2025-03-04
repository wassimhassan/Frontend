import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import FirstPage from './components/FirstPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Chat from './components/Chat';
import Availability from './components/TrainerAvailability';
import TrainerLogin from './components/TrainerLogin';
import Navbar from './components/Navbar';
import ProfileCard from "./components/ProfileCard";
import ResetPassword from "./components/ResetPassword";
import WelcomePage from './components/WelcomePage';

function App() {
  const [trainerId, setTrainerId] = useState(localStorage.getItem("trainerId") || null);

  // Update trainer ID if user logs in
  useEffect(() => {
    const storedId = localStorage.getItem("trainerId");
    if (storedId) setTrainerId(storedId);
  }, []);

  return (
    <Router>
      <MainContent trainerId={trainerId} setTrainerId={setTrainerId} />
    </Router>
  );
}

function MainContent({ trainerId, setTrainerId }) {
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Paths where the Navbar should be hidden
  const hideNavbarPaths = ['/', '/WelcomePage', '/signup', '/login', '/reset-password', '/trainer-login'];

  return (
    <>
      {/* Hide Navbar when on specific paths */}
      {!hideNavbarPaths.includes(location.pathname) && !isSigningUp && !isLoggingIn && <Navbar />}

      <Routes>
        <Route path="/" element={<FirstPage/>} />
        <Route path="/WelcomePage" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUp setIsSigningUp={setIsSigningUp} />} />
        <Route path="/login" element={<Login setIsLoggingIn={setIsLoggingIn} />} />
        <Route path="/trainer-login" element={<TrainerLogin setTrainerId={setTrainerId} />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/availability" element={<Availability trainerId={trainerId} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfileCard />} />
      </Routes>
    </>
  );
}

export default App;
