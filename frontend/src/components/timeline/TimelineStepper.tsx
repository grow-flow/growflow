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
  Warning as WarningIcon,
  PlayArrow as StartIcon,
} from "@mui/icons-material";
import { DynamicPhaseInfo, PlantTimeline } from "@/utils/PlantTimeline";
import { formatDaysAsWeeks } from "@/utils/formatDuration";
import { format } from "date-fns";

interface TimelineStepperProps {
  flatTimeline: DynamicPhaseInfo[];
  plantTimeline: PlantTimeline;
  expandedPhase: number | null;
  onPhaseClick: (phaseId: number) => void;
  onDateChange: (phaseId: number, date: Date | null) => void;
  onStartNextPhase: () => void;
}

export const TimelineStepper: React.FC<TimelineStepperProps> = ({
  flatTimeline,
  plantTimeline,
  expandedPhase,
  onPhaseClick,
  onDateChange,
  onStartNextPhase,
}) => {
  const activeStepIndex = flatTimeline.findIndex((p) => p.isCurrent);

  return (
    <Stepper activeStep={activeStepIndex} orientation="vertical" nonLinear>
      {flatTimeline.map((phaseInfo) => {
        const isExpanded = expandedPhase === phaseInfo.phase.id;

        return (
          <Step
            key={phaseInfo.phase.id}
            completed={phaseInfo.isCompleted}
            active={isExpanded}
            sx={{
              cursor: "pointer",
              "&:hover": { "& .MuiStepIcon-root": { transform: "scale(1.1)" } },
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
                  sx={{ color: phaseInfo.isOverdue ? "warning.main" : "inherit", fontWeight: phaseInfo.isCurrent ? 600 : 400 }}
                >
                  {phaseInfo.phase.name}
                </Typography>

                {phaseInfo.isCurrent && (
                  <Chip label={`${formatDaysAsWeeks(phaseInfo.daysElapsed)} / ${phaseInfo.phase.durationMax}d`} size="small" color="primary" />
                )}

                {phaseInfo.isCompleted && phaseInfo.daysElapsed > 0 && (
                  <Chip
                    label={formatDaysAsWeeks(phaseInfo.daysElapsed)}
                    size="small"
                    variant="outlined"
                    color={phaseInfo.daysElapsed >= phaseInfo.phase.durationMax || phaseInfo.daysElapsed <= phaseInfo.phase.durationMin ? "warning" : "default"}
                  />
                )}

                {phaseInfo.isFuture && phaseInfo.estimatedDate && (
                  <Chip
                    label={`Est. ${format(phaseInfo.estimatedDate, "MMM d")}`}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                )}

                {phaseInfo.isOverdue && <WarningIcon fontSize="small" color="warning" />}
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
                      minDate={plantTimeline.getMinDateForPhase(phaseInfo.phase.id) ?? undefined}
                      maxDate={(() => {
                        const phaseMaxDate = plantTimeline.getMaxDateForPhase(phaseInfo.phase.id);
                        const today = new Date();
                        return phaseMaxDate && phaseMaxDate < today ? phaseMaxDate : today;
                      })()}
                      slotProps={{
                        textField: { size: "medium", fullWidth: true, placeholder: "Not started" },
                        actionBar: { actions: ["clear", "today"] },
                      }}
                    />
                  </Box>

                  {phaseInfo.isOverdue && (
                    <Box sx={{ p: 1, bgcolor: "warning.light", borderRadius: 1, mb: 1 }}>
                      <Typography variant="caption" color="warning.dark">This phase is running longer than expected</Typography>
                    </Box>
                  )}

                  {phaseInfo.isCurrent && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Progress: {Math.round(phaseInfo.progressPercentage)}%
                      </Typography>
                      <LinearProgress variant="determinate" value={phaseInfo.progressPercentage} sx={{ mt: 0.5, height: 4, borderRadius: 2 }} />
                      {plantTimeline.canAdvanceToNextPhase() && (
                        <Button size="small" variant="contained" startIcon={<StartIcon />} onClick={onStartNextPhase} sx={{ mt: 1 }}>
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
