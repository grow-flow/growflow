import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PlantsOverview from './pages/PlantsOverview';
import StrainsOverview from './pages/StrainsOverview';
import PlantDetail from './pages/PlantDetail';
import Settings from './pages/Settings';

function App() {
  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<PlantsOverview />} />
          <Route path="/strains" element={<StrainsOverview />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;