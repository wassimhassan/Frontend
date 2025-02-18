import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProfileCard from "./components/ProfileCard";
import PtCard from "./components/PtCard";

console.log("ProfileCard:", ProfileCard);
console.log("PtCard:", PtCard);

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<ProfileCard />} />
        <Route path="/ptcard" element={<PtCard />} />
      </Routes>
    </div>
  );
}

export default App;