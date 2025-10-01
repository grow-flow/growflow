import React, { useState, useMemo, useEffect } from "react";
import { Box, Typography, LinearProgress, IconButton } from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plant } from "@/types/models";
import { apiService } from "@/services/api";
import { createPlantTimeline } from "@/utils/PlantTimeline";
import { TimelineStepper } from "./timeline/TimelineStepper";
import { PhaseConfigDialog } from "./timeline/PhaseConfigDialog";

interface DynamicPlantTimelineProps {
  plant: Plant;
}

const DynamicPlantTimeline: React.FC<DynamicPlantTimelineProps> = ({ plant }) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [lastCurrentPhaseId, setLastCurrentPhaseId] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const plantTimeline = useMemo(
    () => createPlantTimeline(plant.phases || [], plant.events || []),
    [plant.phases, plant.events, plant.id, plant.updated_at]
  );

  const timeline = plantTimeline.timeline;
  const totalProgress = plantTimeline.totalProgress;
  const daysUntilHarvest = plantTimeline.daysUntilHarvest;
  const daysUntilNext = plantTimeline.daysUntilNextPhase;

  const updatePhaseDateMutation = useMutation({
    mutationFn: ({ phaseId, startDate }: { phaseId: string; startDate: string | null }) =>
      apiService.updatePhaseStartDate(plant.id, phaseId, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", plant.id] });
    },
  });

  const startNextPhaseMutation = useMutation({
    mutationFn: () => apiService.startNextPhase(plant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", plant.id] });
    },
  });

  const updatePhasesMutation = useMutation({
    mutationFn: (phases: any[]) => apiService.updatePlantPhases(plant.id, phases),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", plant.id] });
      setConfigModalOpen(false);
    },
  });

  useEffect(() => {
    const currentPhaseId = plantTimeline.currentPhase?.id;
    if (currentPhaseId && currentPhaseId !== lastCurrentPhaseId) {
      setExpandedPhase(currentPhaseId);
      setLastCurrentPhaseId(currentPhaseId);
    }
  }, [plantTimeline.currentPhase?.id, lastCurrentPhaseId]);

  const handlePhaseClick = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const handleDateChange = async (phaseId: string, newDate: Date | null) => {
    const phaseIndex = plantTimeline.getPhaseIndex(phaseId);

    if (newDate) {
      const validation = plantTimeline.validatePhaseDate(phaseIndex, newDate);
      if (!validation.isValid) {
        console.error("Invalid date:", validation.error);
        return;
      }
    }

    try {
      await updatePhaseDateMutation.mutateAsync({
        phaseId,
        startDate: newDate?.toISOString() || null,
      });
    } catch (error) {
      console.error("Failed to update date:", error);
    }
  };

  const handleStartNextPhase = async () => {
    try {
      await startNextPhaseMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to start next phase:", error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Growth Timeline</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="caption" color="textSecondary">
              {Math.round(totalProgress)}% Complete
            </Typography>
            {daysUntilHarvest && (
              <Typography variant="caption" color="textSecondary">
                ~{daysUntilHarvest} days to harvest
              </Typography>
            )}
            {daysUntilNext !== null && daysUntilNext > 0 && (
              <Typography variant="caption" color="textSecondary">
                {daysUntilNext} days until next phase
              </Typography>
            )}
            <IconButton size="small" onClick={() => setConfigModalOpen(true)} sx={{ ml: 1 }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={totalProgress}
          sx={{ mb: 3, height: 6, borderRadius: 3 }}
        />

        <TimelineStepper
          timeline={timeline}
          plantTimeline={plantTimeline}
          expandedPhase={expandedPhase}
          onPhaseClick={handlePhaseClick}
          onDateChange={handleDateChange}
          onStartNextPhase={handleStartNextPhase}
        />

        <PhaseConfigDialog
          open={configModalOpen}
          phases={plant.phases}
          plantTimeline={plantTimeline}
          onClose={() => setConfigModalOpen(false)}
          onSave={(phases) => updatePhasesMutation.mutate(phases)}
          isSaving={updatePhasesMutation.isPending}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicPlantTimeline;
