import React from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Chip,
} from "@mui/material";
import { Opacity } from "@mui/icons-material";
import { Plant } from "../types/models";

interface PlantHeaderProps {
  plant: Plant;
  onWaterClick: () => void;
}

const PlantHeader: React.FC<PlantHeaderProps> = ({ plant, onWaterClick }) => {
  const getCurrentPhase = () => {
    return plant.phases.find((phase) => phase.is_active);
  };

  const getDaysInCurrentPhase = () => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase?.start_date) return 0;

    const now = new Date();
    const start = new Date(currentPhase.start_date);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTotalDays = () => {
    const firstPhase = plant.phases.find((p) => p.start_date);
    if (!firstPhase?.start_date) return 0;

    const now = new Date();
    const start = new Date(firstPhase.start_date);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            {plant.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Chip label={plant.strain} color="primary" />
            <Chip
              label={getCurrentPhase()?.name || "Unknown"}
              color="secondary"
            />
            <Chip 
              label={plant.start_method === 'seed' ? 'Seed' : 'Clone'} 
              variant="outlined" 
              color="info"
            />
            <Chip label={plant.medium} variant="outlined" />
            {plant.is_mother_plant && (
              <Chip label="Mother Plant" color="success" />
            )}
          </Box>
          <Typography color="textSecondary">
            Day {getDaysInCurrentPhase()} in{" "}
            {getCurrentPhase()?.name || "Unknown"} • Total: {getTotalDays()}{" "}
            days
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            startIcon={<Opacity />}
            onClick={onWaterClick}
            fullWidth
          >
            Water Now
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PlantHeader;