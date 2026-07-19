import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout/Layout.tsx";
import Home from "./App.tsx";
import Tournament from "./pages/Tournament.tsx";
import RoundLeaderboard from "./pages/RoundLeaderboard.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments/:id" element={<Tournament />} />
          <Route path="/tournaments/:id/leaderboard" element={<RoundLeaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
