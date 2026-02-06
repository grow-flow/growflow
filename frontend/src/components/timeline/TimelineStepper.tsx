import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  Chip,
  Button,
  LinearProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
} from "@mui/icons-material";
import { DynamicPhaseInfo, PlantTimeline } from "@/utils/PlantTimeline";

interface TimelineStepperProps {
  timeline: DynamicPhaseInfo[];
  plantTimeline: PlantTimeline;
  expandedPhase: string | null;
  onPhaseClick: (phaseId: string) => void;
  onDateChange: (phaseId: string, date: Date | null) => void;
  onStartNextPhase: () => void;
}

export const TimelineStepper: React.FC<TimelineStepperProps> = ({
  timeline,
  plantTimeline,
  expandedPhase,
  onPhaseClick,
  onDateChange,
  onStartNextPhase,
}) => {
  const activeStepIndex = timeline.findIndex((p) => p.isCurrent);

  const getPhaseIcon = (phaseInfo: DynamicPhaseInfo) => {
    if (phaseInfo.isOverdue)
      return <WarningIcon fontSize="small" color="warning" />;
    if (phaseInfo.isCompleted && phaseInfo.actualDate)
      return <CheckIcon fontSize="small" color="success" />;
    return null;
  };

  return (
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
                  color: phaseInfo.isOverdue ? "#ff9800 !important" : undefined,
                  transform: phaseInfo.isCurrent ? "scale(1.1)" : undefined,
                },
              }}
              onClick={() => onPhaseClick(phaseInfo.phase.id)}
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
                      phaseInfo.daysElapsed >= phaseInfo.phase.duration_max ||
                      phaseInfo.daysElapsed <= phaseInfo.phase.duration_min
                        ? "warning"
                        : "default"
                    }
                  />
                )}

                {!phaseInfo.actualDate && !phaseInfo.isCurrent && !phaseInfo.isCompleted && (
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
                    <DatePicker
                      format="dd/MM/yy"
                      value={phaseInfo.actualDate}
                      onChange={(date) => onDateChange(phaseInfo.phase.id, date)}
                      minDate={plantTimeline.getMinDateForPhase(
                        plantTimeline.getPhaseIndex(phaseInfo.phase.id)
                      )}
                      maxDate={(() => {
                        const phaseMaxDate = plantTimeline.getMaxDateForPhase(
                          plantTimeline.getPhaseIndex(phaseInfo.phase.id)
                        );
                        const today = new Date();
                        return phaseMaxDate && phaseMaxDate < today ? phaseMaxDate : today;
                      })()}
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
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {phaseInfo.phase.description}
                    </Typography>
                  )}

                  {phaseInfo.isOverdue && (
                    <Box sx={{ p: 1, bgcolor: "warning.light", borderRadius: 1 }}>
                      <Typography variant="caption" color="warning.dark">
                        This phase is running longer than expected
                      </Typography>
                    </Box>
                  )}

                  {phaseInfo.isCurrent && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Phase Progress: {Math.round(phaseInfo.progressPercentage)}%
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
                          onClick={onStartNextPhase}
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
  );
};
