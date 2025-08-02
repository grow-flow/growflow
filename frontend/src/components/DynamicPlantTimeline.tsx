import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  IconButton,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
  DragIndicator as DragIndicatorIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { Plant, PlantPhaseInstance } from "../types/models";
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
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editablePhases, setEditablePhases] = useState<PlantPhaseInstance[]>([]);
  const [newPhaseDialog, setNewPhaseDialog] = useState(false);
  const [newPhaseData, setNewPhaseData] = useState({
    name: '',
    duration_min: 7,
    duration_max: 14,
    description: ''
  });
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

  const updatePhasesMutation = useMutation({
    mutationFn: (phases: PlantPhaseInstance[]) => 
      apiService.updatePlantPhases(plant.id, phases),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", plant.id] });
      setConfigModalOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update phases:', error);
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

  // Initialize editable phases when modal opens
  useEffect(() => {
    if (configModalOpen) {
      setEditablePhases([...plant.phases]);
    }
  }, [configModalOpen, plant.phases]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = editablePhases.findIndex((phase) => phase.id === active.id);
      const newIndex = editablePhases.findIndex((phase) => phase.id === over.id);

      setEditablePhases((phases) => arrayMove(phases, oldIndex, newIndex));
    }
  };

  const handleSavePhases = () => {
    updatePhasesMutation.mutate(editablePhases);
  };

  const handleAddPhase = () => {
    if (!newPhaseData.name.trim()) {
      alert('Phase name is required');
      return;
    }
    
    if (newPhaseData.duration_min <= 0 || newPhaseData.duration_max <= 0) {
      alert('Duration must be positive numbers');
      return;
    }
    
    if (newPhaseData.duration_min > newPhaseData.duration_max) {
      alert('Minimum duration cannot be greater than maximum duration');
      return;
    }

    const newPhase: PlantPhaseInstance = {
      id: uuidv4(),
      name: newPhaseData.name.trim(),
      duration_min: newPhaseData.duration_min,
      duration_max: newPhaseData.duration_max,
      description: newPhaseData.description.trim() || undefined,
      is_active: false,
      is_completed: false
    };
    
    setEditablePhases([...editablePhases, newPhase]);
    setNewPhaseDialog(false);
    setNewPhaseData({ name: '', duration_min: 7, duration_max: 14, description: '' });
  };

  const handleDeletePhase = (phaseId: string) => {
    const phase = editablePhases.find(p => p.id === phaseId);
    if (phase?.start_date) {
      alert('Cannot delete a phase that has already started');
      return;
    }
    
    if (editablePhases.length <= 1) {
      alert('Must have at least one phase');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${phase?.name}" phase?`)) {
      setEditablePhases(editablePhases.filter(p => p.id !== phaseId));
    }
  };

  // Sortable Phase Card Component
  const SortablePhaseCard: React.FC<{ phase: PlantPhaseInstance; index: number }> = ({ phase, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: phase.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isStarted = !!phase.start_date;
    const isCurrent = plantTimeline.currentPhase?.id === phase.id;

    return (
      <Card
        ref={setNodeRef}
        style={style}
        sx={{
          mb: 1,
          border: isCurrent ? '2px solid' : '1px solid',
          borderColor: isCurrent ? 'primary.main' : 'divider',
          backgroundColor: isStarted ? 'action.hover' : 'background.paper',
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              {...attributes}
              {...listeners}
              sx={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <DragIndicatorIcon />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: isCurrent ? 600 : 400 }}>
                  {index + 1}. {phase.name}
                </Typography>
                {isCurrent && (
                  <Chip label="Current" size="small" color="primary" />
                )}
                {isStarted && !isCurrent && (
                  <CheckIcon fontSize="small" color="success" />
                )}
              </Box>
              
              <Typography variant="caption" color="textSecondary" display="block">
                Duration: {phase.duration_min}-{phase.duration_max} days
              </Typography>
              
              {phase.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  {phase.description}
                </Typography>
              )}
              
              {isStarted && (
                <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                  Started: {plantTimeline.formatPhaseDate(new Date(phase.start_date!))}
                </Typography>
              )}
            </Box>
            
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeletePhase(phase.id)}
              disabled={!!phase.start_date}
              sx={{ opacity: phase.start_date ? 0.3 : 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
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
            <IconButton
              size="small"
              onClick={() => setConfigModalOpen(true)}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
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

        {/* Phase Configuration Modal */}
        <Dialog
          open={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { height: '80vh' }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Configure Growth Phases</Typography>
              <IconButton
                onClick={() => setConfigModalOpen(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pb: 0 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Drag and drop to reorder phases. Click the delete button to remove phases that haven't started yet. Add new phases with the button below.
            </Typography>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={editablePhases.map(phase => phase.id)}
                strategy={verticalListSortingStrategy}
              >
                {editablePhases.map((phase, index) => (
                  <SortablePhaseCard
                    key={phase.id}
                    phase={phase}
                    index={index}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setNewPhaseDialog(true)}
              >
                Add Phase
              </Button>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setConfigModalOpen(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePhases}
              variant="contained"
              color="primary"
              disabled={updatePhasesMutation.isPending}
            >
              {updatePhasesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add New Phase Dialog */}
        <Dialog
          open={newPhaseDialog}
          onClose={() => setNewPhaseDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Phase</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus
              margin="normal"
              label="Phase Name"
              fullWidth
              variant="outlined"
              value={newPhaseData.name}
              onChange={(e) => setNewPhaseData({ ...newPhaseData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Min Duration (days)"
                type="number"
                value={newPhaseData.duration_min}
                onChange={(e) => setNewPhaseData({ ...newPhaseData, duration_min: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Max Duration (days)"
                type="number"
                value={newPhaseData.duration_max}
                onChange={(e) => setNewPhaseData({ ...newPhaseData, duration_max: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1 }}
              />
            </Box>
            
            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newPhaseData.description}
              onChange={(e) => setNewPhaseData({ ...newPhaseData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewPhaseDialog(false)}>Cancel</Button>
            <Button onClick={handleAddPhase} variant="contained">Add Phase</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicPlantTimeline;
