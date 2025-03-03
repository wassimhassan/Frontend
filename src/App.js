import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Chat from './components/Chat';
import Availability from './components/Availability';
import Navbar from './components/navbar';
import ProfileCard from "./components/ProfileCard";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<  SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/availability" element={<Availability />} />
       
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfileCard />} />
      </Routes>
    </Router>
  );
}

export default App;
