import React, { useMemo } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Chip,
  IconButton,
} from "@mui/material";
import { Opacity, Edit } from "@mui/icons-material";
import { Plant } from "../types/models";
import { createPlantTimeline } from "../utils/PlantTimeline";

interface PlantHeaderProps {
  plant: Plant;
  onWaterClick: () => void;
  onEditClick: () => void;
}

const PlantHeader: React.FC<PlantHeaderProps> = ({ plant, onWaterClick, onEditClick }) => {
  const timeline = useMemo(() =>
    createPlantTimeline(plant.phases || [], plant.events || []),
    [plant.phases, plant.events, plant.id, plant.updatedAt]
  );

  const currentPhaseInfo = timeline.timeline.find(p => p.isCurrent);
  const currentPhase = currentPhaseInfo?.phase;

  const getDaysInCurrentPhase = () => currentPhaseInfo?.daysElapsed || 0;

  const getTotalDays = () => {
    const firstPhase = plant.phases?.find((p) => p.startDate);
    if (!firstPhase?.startDate) return 0;
    const diffTime = Math.abs(new Date().getTime() - new Date(firstPhase.startDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h4">{plant.name}</Typography>
            <IconButton onClick={onEditClick} size="small" sx={{ ml: 1 }}>
              <Edit />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Chip label={plant.strain?.name || 'Unknown Strain'} color="primary" />
            <Chip label={currentPhase?.name || "Unknown"} color="secondary" />
          </Box>
          <Typography color="textSecondary">
            Day {getDaysInCurrentPhase()} in {currentPhase?.name || "Unknown"} • Total: {getTotalDays()} days
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
