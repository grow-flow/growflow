import React, { useMemo } from "react";
import { Typography, Paper, Box, Chip, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { Plant } from "@/types/models";
import { createPlantTimeline } from "@/utils/PlantTimeline";
import { formatDaysAsWeeks } from "@/utils/formatDuration";

interface PlantHeaderProps {
  plant: Plant;
  onEditClick: () => void;
}

const PlantHeader: React.FC<PlantHeaderProps> = ({ plant, onEditClick }) => {
  const timeline = useMemo(
    () => createPlantTimeline(plant.phases || [], plant.events || []),
    [plant.phases, plant.events, plant.id, plant.updatedAt]
  );

  const currentPhaseInfo = timeline.flatTimeline.find((p) => p.isCurrent);
  const currentPhase = currentPhaseInfo?.phase;

  const getTotalDays = () => {
    const firstPhase = plant.phases?.find((p) => p.startDate);
    if (!firstPhase?.startDate) return 0;
    return Math.ceil(Math.abs(new Date().getTime() - new Date(firstPhase.startDate).getTime()) / 86400000);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h4">{plant.name}</Typography>
        <IconButton onClick={onEditClick} size="small" sx={{ ml: 1 }}>
          <Edit />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
        {plant.strain && <Chip label={plant.strain.name} color="primary" />}
        <Chip label={currentPhase?.name || "Unknown"} color="secondary" />
      </Box>
      <Typography color="textSecondary">
        {formatDaysAsWeeks(currentPhaseInfo?.daysElapsed || 0)} in {currentPhase?.name || "Unknown"} • Total: {formatDaysAsWeeks(getTotalDays())}
      </Typography>
    </Paper>
  );
};

export default PlantHeader;
