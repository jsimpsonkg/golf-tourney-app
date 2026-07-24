import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout/Layout.tsx";
import Home from "./pages/Leaderboard.tsx";
import Tournament from "./pages/Tournament.tsx";
import RoundLeaderboard from "./pages/RoundLeaderboard.tsx";
import TeamPage from "./pages/TeamPage.tsx";
import ViewScores from "./pages/ViewScores.tsx";
import TeamScores from "./pages/TeamScores.tsx";
import EnterScores from "./pages/EnterScores.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments/:id" element={<Tournament />} />
          <Route path="/tournaments/:id/leaderboard" element={<RoundLeaderboard />} />
          <Route path="/tournaments/:id/teams/:teamId" element={<TeamPage />} />
          <Route path="/matches/:matchId" element={<ViewScores />} />
          <Route path="/matches/:matchId/teams/:teamIndex" element={<TeamScores />} />
          <Route path="/matches/:matchId/enter" element={<EnterScores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
