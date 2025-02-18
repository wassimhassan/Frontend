import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProfileCard from "./components/ProfileCard";

console.log("ProfileCard:", ProfileCard); // ✅ Add this line

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<ProfileCard />} />
      </Routes>
    </div>
  );
}

export default App;
