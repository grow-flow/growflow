import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Button,
  LinearProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
} from "@mui/icons-material";
import { Plant } from "../types/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import {
  createPlantTimeline,
  getEventIcon,
  getEventColor,
} from "../utils/PlantTimeline";

interface DynamicPlantTimelineProps {
  plant: Plant;
}

const DynamicPlantTimeline: React.FC<DynamicPlantTimelineProps> = ({
  plant,
}) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [lastCurrentPhaseId, setLastCurrentPhaseId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updatePhaseDateMutation = useMutation({
    mutationFn: ({
      phaseId,
      startDate,
    }: {
      phaseId: string;
      startDate: string | null;
    }) => apiService.updatePhaseStartDate(plant.id, phaseId, startDate),
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

  // Create timeline instance - include plant.id to ensure updates after mutations
  const plantTimeline = useMemo(
    () => createPlantTimeline(plant.phases, plant.events || []),
    [plant.phases, plant.events, plant.id, plant.updated_at]
  );

  const timeline = plantTimeline.timeline;
  const totalProgress = plantTimeline.totalProgress;
  const daysUntilHarvest = plantTimeline.daysUntilHarvest;
  const daysUntilNext = plantTimeline.daysUntilNextPhase;

  const handlePhaseClick = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  // Auto-expand current phase when it actually changes (not on user interaction)
  useEffect(() => {
    const currentPhaseId = plantTimeline.currentPhase?.id;
    
    // Only auto-expand if:
    // 1. We have a current phase AND
    // 2. The current phase ID actually changed (not just user clicking) AND
    // 3. It's either initial load (no lastCurrentPhaseId) or the phase genuinely changed
    if (currentPhaseId && currentPhaseId !== lastCurrentPhaseId) {
      setExpandedPhase(currentPhaseId);
      setLastCurrentPhaseId(currentPhaseId);
    }
  }, [plantTimeline.currentPhase?.id, lastCurrentPhaseId]);

  const handleDateChange = async (phaseId: string, newDate: Date | null) => {
    if (!newDate) {
      // Handle clearing date
      try {
        await updatePhaseDateMutation.mutateAsync({
          phaseId,
          startDate: null,
        });
      } catch (error) {
        console.error("Failed to clear date:", error);
      }
      return;
    }

    const phaseIndex = plantTimeline.getPhaseIndex(phaseId);
    const validation = plantTimeline.validatePhaseDate(phaseIndex, newDate);

    if (!validation.isValid) {
      console.error("Invalid date:", validation.error);
      return;
    }

    try {
      await updatePhaseDateMutation.mutateAsync({
        phaseId,
        startDate: newDate.toISOString(),
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

  const activeStepIndex = timeline.findIndex((p) => p.isCurrent);

  const getPhaseIcon = (phaseInfo: any) => {
    if (phaseInfo.isOverdue)
      return <WarningIcon fontSize="small" color="warning" />;
    if (phaseInfo.isCompleted && phaseInfo.actualDate)
      return <CheckIcon fontSize="small" color="success" />;
    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
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
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={totalProgress}
          sx={{ mb: 3, height: 6, borderRadius: 3 }}
        />

        <Stepper activeStep={activeStepIndex} orientation="vertical">
          {timeline.map((phaseInfo) => {
            const isExpanded = expandedPhase === phaseInfo.phase.id;

            return (
              <Step
                key={phaseInfo.phase.id}
                completed={phaseInfo.isCompleted}
                active={isExpanded}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    "& .MuiStepIcon-root": {
                      transform: "scale(1.1)",
                    },
                  },
                }}
              >
                <StepLabel
                  sx={{
                    "& .MuiStepIcon-root": {
                      color: phaseInfo.isOverdue
                        ? "#ff9800 !important"
                        : undefined,
                      transform: phaseInfo.isCurrent ? "scale(1.1)" : undefined,
                    },
                  }}
                  onClick={() => handlePhaseClick(phaseInfo.phase.id)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: phaseInfo.isOverdue ? "warning.main" : "inherit",
                        fontWeight: phaseInfo.isCurrent ? 600 : 400,
                      }}
                    >
                      {phaseInfo.phase.name}
                    </Typography>

                    {phaseInfo.isCurrent && (
                      <Chip
                        label={`Day ${phaseInfo.daysElapsed}/${phaseInfo.phase.duration_max}`}
                        size="small"
                        color="primary"
                      />
                    )}

                    {phaseInfo.isCompleted && (
                      <Chip
                        label={`${phaseInfo.daysElapsed} days`}
                        size="small"
                        variant="outlined"
                        color={
                          phaseInfo.daysElapsed >=
                            phaseInfo.phase.duration_max ||
                          phaseInfo.daysElapsed <= phaseInfo.phase.duration_min
                            ? "warning"
                            : "default"
                        }
                      />
                    )}

                    {!phaseInfo.actualDate &&
                      !phaseInfo.isCurrent &&
                      !phaseInfo.isCompleted && (
                        <Chip
                          label={`Est. ${phaseInfo.phase.duration_min}-${phaseInfo.phase.duration_max} days`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}

                    {getPhaseIcon(phaseInfo)}
                  </Box>
                </StepLabel>

                {isExpanded && (
                  <StepContent>
                    <Box sx={{ pb: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        {/* <Typography
                          variant="caption"
                          color="textSecondary"
                          display="block"
                          sx={{ mb: 1 }}
                        >
                          Start Date
                        </Typography> */}
                        <DatePicker
                          format="dd/MM/yy"
                          value={phaseInfo.actualDate}
                          onChange={(date) =>
                            handleDateChange(phaseInfo.phase.id, date)
                          }
                          minDate={plantTimeline.getMinDateForPhase(
                            plantTimeline.getPhaseIndex(phaseInfo.phase.id)
                          )}
                          maxDate={plantTimeline.getMaxDateForPhase(
                            plantTimeline.getPhaseIndex(phaseInfo.phase.id)
                          )}
                          slotProps={{
                            textField: {
                              size: "medium",
                              fullWidth: true,
                              placeholder: "Not started",
                            },
                            actionBar: { actions: ["clear", "today"] },
                          }}
                        />
                      </Box>

                      {phaseInfo.phase.description && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 1 }}
                        >
                          {phaseInfo.phase.description}
                        </Typography>
                      )}

                      {/* Phase Events */}
                      {(() => {
                        const phaseEvents = plantTimeline.getPhaseEvents(
                          phaseInfo.phase.id
                        );
                        const lastWatering =
                          plantTimeline.getDaysSinceLastEvent(
                            phaseInfo.phase.id,
                            "watering"
                          );
                        const lastFeeding = plantTimeline.getDaysSinceLastEvent(
                          phaseInfo.phase.id,
                          "feeding"
                        );

                        return (
                          <Box sx={{ mt: 1 }}>
                            {phaseEvents.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  display="block"
                                >
                                  Events in this phase ({phaseEvents.length})
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                    mt: 0.5,
                                  }}
                                >
                                  {phaseEvents.slice(0, 5).map((event) => (
                                    <Chip
                                      key={event.id}
                                      label={`${getEventIcon(event.type)} ${
                                        event.title
                                      }`}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: "0.7rem",
                                        height: 20,
                                        borderColor: getEventColor(event.type),
                                        color: getEventColor(event.type),
                                      }}
                                    />
                                  ))}
                                  {phaseEvents.length > 5 && (
                                    <Chip
                                      label={`+${phaseEvents.length - 5} more`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: "0.7rem", height: 20 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Care reminders for current phase */}
                            {phaseInfo.isCurrent && (
                              <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                                {lastWatering !== null && (
                                  <Typography
                                    variant="caption"
                                    color={
                                      lastWatering > 3
                                        ? "warning.main"
                                        : "textSecondary"
                                    }
                                  >
                                    💧{" "}
                                    {lastWatering === 0
                                      ? "Today"
                                      : `${lastWatering}d ago`}
                                  </Typography>
                                )}
                                {lastFeeding !== null && (
                                  <Typography
                                    variant="caption"
                                    color={
                                      lastFeeding > 7
                                        ? "warning.main"
                                        : "textSecondary"
                                    }
                                  >
                                    🌱{" "}
                                    {lastFeeding === 0
                                      ? "Today"
                                      : `${lastFeeding}d ago`}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })()}

                      {phaseInfo.isOverdue && (
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: "warning.light",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="caption" color="warning.dark">
                            This phase is running longer than expected
                          </Typography>
                        </Box>
                      )}

                      {phaseInfo.isCurrent && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Phase Progress:{" "}
                              {Math.round(phaseInfo.progressPercentage)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={phaseInfo.progressPercentage}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                            />
                            {plantTimeline.canAdvanceToNextPhase() && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<StartIcon />}
                                onClick={handleStartNextPhase}
                                sx={{ mt: 1 }}
                              >
                                Start Next Phase
                              </Button>
                            )}
                          </Box>
                        )}
                    </Box>
                  </StepContent>
                )}
              </Step>
            );
          })}
        </Stepper>
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicPlantTimeline;
