import React, { useMemo } from "react";
import { Typography, Paper, Box, Chip, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Plant } from "@/types/models";
import { createPlantTimeline } from "@/utils/PlantTimeline";
import { formatDaysAsWeeks } from "@/utils/formatDuration";
import { evaluatePlantHappiness, happinessColor } from "@/utils/plantEnvironment";

interface PlantHeaderProps {
  plant: Plant;
  onEditClick: () => void;
}

const PlantHeader: React.FC<PlantHeaderProps> = ({ plant, onEditClick }) => {
  const navigate = useNavigate();
  const timeline = useMemo(
    () => createPlantTimeline(plant.phases || [], plant.events || []),
    [plant.phases, plant.events, plant.id, plant.updatedAt]
  );

  const currentPhaseInfo = timeline.flatTimeline.find((p) => p.isCurrent);
  const currentPhase = currentPhaseInfo?.phase;
  const happiness = useMemo(
    () => evaluatePlantHappiness(plant, plant.area ?? null),
    [plant]
  );

  const getTotalDays = () => {
    const firstPhase = plant.phases?.find((p) => p.startDate);
    if (!firstPhase?.startDate) return 0;
    return Math.ceil(Math.abs(new Date().getTime() - new Date(firstPhase.startDate).getTime()) / 86400000);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 1.75,
            bgcolor: "rgba(76,175,80,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            flexShrink: 0,
          }}
        >
          🌱
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="h4" noWrap>
              {plant.name}
            </Typography>
            <IconButton onClick={onEditClick} size="small">
              <Edit fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
            {plant.strain && <Chip label={plant.strain.name} size="small" color="primary" />}
            <Chip
              label={currentPhase?.name || "Unknown"}
              size="small"
              color="secondary"
            />
            {plant.area && (
              <>
                <Chip
                  label={`⛺ ${plant.area.name}${plant.area.lightSchedule ? ` · ${plant.area.lightSchedule}` : ""}`}
                  size="small"
                  variant="outlined"
                  color="warning"
                  clickable
                  onClick={() => navigate(`/area/${plant.area!.id}`)}
                />
                {happiness.overall !== "unknown" && (
                  <Chip
                    label={happiness.summary}
                    size="small"
                    color={happinessColor(happiness.overall)}
                    variant="outlined"
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1.5 }}>
        {formatDaysAsWeeks(currentPhaseInfo?.daysElapsed || 0)} in {currentPhase?.name || "Unknown"} • Total: {formatDaysAsWeeks(getTotalDays())}
      </Typography>
    </Paper>
  );
};

export default PlantHeader;
