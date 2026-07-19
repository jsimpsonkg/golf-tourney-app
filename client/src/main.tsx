import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./App.tsx";
import Tournament from "./pages/Tournament.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments/:id" element={<Tournament />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
