import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import FoodRegister from "./pages/FoodRegister";
import MealPlanner from "./pages/MealPlanner";
import ActivityTracker from "./pages/ActivityTracker";
import ProgressStats from "./pages/ProgressStats";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Ejercicios from "./pages/Ejercicios";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename="/fit">

      
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Home />} />
        <Route path="/food-register" element={<FoodRegister />}  />
        <Route path="/meal-planner" element={<MealPlanner />}  />
        <Route path="/activity-tracker" element={<ActivityTracker />}  />
        <Route path="/progress-stats" element={<ProgressStats />}  />
        <Route path="/settings" element={<Settings />}  />
        <Route path="/ejercicios" element={<Ejercicios />}  />
   
      </Routes>
     
      </BrowserRouter>
  );
}

export default App;
