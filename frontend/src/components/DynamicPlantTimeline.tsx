import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Chip, 
  IconButton, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Menu,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Edit as EditIcon, 
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { Plant } from '../types/models';
import { useUpdatePlant } from '../hooks/usePlants';
import { 
  generateDynamicTimeline, 
  isPhaseReadyForNext, 
  calculateTotalProgress, 
  getDaysUntilHarvest, 
  getDaysUntilNextPhase,
  formatPhaseDate,
  getPhaseEvents,
  getEventIcon,
  getEventColor,
  getDaysSinceLastEvent
} from '../utils/dynamicTimelineUtils';

interface DynamicPlantTimelineProps {
  plant: Plant;
}

const DynamicPlantTimeline: React.FC<DynamicPlantTimelineProps> = ({ plant }) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuPhase, setMenuPhase] = useState<string | null>(null);
  const updatePlantMutation = useUpdatePlant();
  
  const timeline = generateDynamicTimeline(plant);
  const currentPhaseInfo = timeline.find(p => p.isCurrent);
  
  const totalProgress = calculateTotalProgress(timeline);
  const daysUntilHarvest = getDaysUntilHarvest(timeline);
  const daysUntilNext = getDaysUntilNextPhase(timeline);
    
  const handlePhaseClick = (phaseId: string) => {
    setSelectedPhase(selectedPhase === phaseId ? null : phaseId);
  };

  const handleDateEdit = (phaseId: string, currentDate: Date | null) => {
    setSelectedPhase(phaseId);
    setNewDate(currentDate || new Date());
    setDateDialogOpen(true);
  };

  const handleDateSave = async () => {
    if (!selectedPhase) return;

    try {
      const startDate = newDate ? newDate.toISOString() : null;
      
      const response = await fetch(`/api/plants/${plant.id}/phase/${selectedPhase}/start-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate })
      });

      if (!response.ok) throw new Error('Failed to update phase date');

      // Trigger refetch
      await updatePlantMutation.mutateAsync({ id: plant.id, data: {} });

      setDateDialogOpen(false);
      setSelectedPhase(null);
      setNewDate(null);
    } catch (error) {
      console.error('Failed to update date:', error);
    }
  };
  
  const handleClearDate = async (phaseId: string) => {
    try {
      const response = await fetch(`/api/plants/${plant.id}/phase/${phaseId}/start-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: null })
      });

      if (!response.ok) throw new Error('Failed to clear phase date');

      // Trigger refetch
      await updatePlantMutation.mutateAsync({ id: plant.id, data: {} });
      
      setMenuAnchor(null);
      setMenuPhase(null);
    } catch (error) {
      console.error('Failed to clear date:', error);
    }
  };
  
  const handleStartNextPhase = async () => {
    try {
      const response = await fetch(`/api/plants/${plant.id}/advance-phase`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to advance phase');

      // Trigger refetch
      await updatePlantMutation.mutateAsync({ id: plant.id, data: {} });
    } catch (error) {
      console.error('Failed to advance phase:', error);
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, phaseId: string) => {
    setMenuAnchor(event.currentTarget);
    setMenuPhase(phaseId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPhase(null);
  };

  const activeStepIndex = selectedPhase 
    ? timeline.findIndex(p => p.phase.id === selectedPhase) 
    : timeline.findIndex(p => p.isCurrent);

  const getPhaseIcon = (phaseInfo: any) => {
    if (phaseInfo.isOverdue) return <WarningIcon fontSize="small" color="warning" />;
    if (phaseInfo.isCompleted) return <CheckIcon fontSize="small" color="success" />;
    return null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Growth Timeline</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="textSecondary">
              {Math.round(totalProgress)}% Complete
            </Typography>
            {currentPhaseInfo && isPhaseReadyForNext(currentPhaseInfo) && (
              <Button
                size="small"
                variant="contained"
                startIcon={<StartIcon />}
                onClick={handleStartNextPhase}
              >
                Start Next Phase
              </Button>
            )}
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
          {timeline.map((phaseInfo, index) => {
            const isSelected = selectedPhase === phaseInfo.phase.id;
            
            return (
              <Step 
                key={phaseInfo.phase.id} 
                completed={phaseInfo.isCompleted}
                active={phaseInfo.isCurrent}
              >
                <StepLabel
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiStepIcon-root': {
                        transform: 'scale(1.1)'
                      }
                    },
                    '& .MuiStepIcon-root': {
                      color: phaseInfo.isOverdue ? '#ff9800 !important' : undefined,
                      transform: phaseInfo.isCurrent ? 'scale(1.1)' : undefined
                    }
                  }}
                  onClick={() => handlePhaseClick(phaseInfo.phase.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        color: phaseInfo.isOverdue ? 'warning.main' : 'inherit',
                        fontWeight: phaseInfo.isCurrent ? 600 : 400
                      }}
                    >
                      {phaseInfo.phase.name}
                    </Typography>
                    
                    {phaseInfo.isCurrent && (
                      <Chip
                        label={`Day ${phaseInfo.daysElapsed}/${phaseInfo.duration}`}
                        size="small"
                        color="primary"
                      />
                    )}
                    
                    {phaseInfo.isCompleted && (
                      <Chip
                        label={`${phaseInfo.daysElapsed} days`}
                        size="small"
                        variant="outlined"
                        color={phaseInfo.daysElapsed > phaseInfo.duration * 1.2 ? 'warning' : 'default'}
                      />
                    )}
                    
                    {!phaseInfo.actualDate && !phaseInfo.isCurrent && (
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
                
                <StepContent>
                  <Box sx={{ pb: 2, display: isSelected || (phaseInfo.isCurrent && !selectedPhase) ? 'block' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {phaseInfo.actualDate ? 'Started' : 'Not started'}
                        </Typography>
                        <Typography variant="body2">
                          {formatPhaseDate(phaseInfo.actualDate)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Estimated
                        </Typography>
                        <Typography variant="body2">
                          {formatPhaseDate(phaseInfo.estimatedDate)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Duration Range
                        </Typography>
                        <Typography variant="body2">
                          {phaseInfo.phase.duration_min}-{phaseInfo.phase.duration_max} days
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDateEdit(phaseInfo.phase.id, phaseInfo.actualDate)}
                          title="Edit date"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, phaseInfo.phase.id)}
                          title="More options"
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {phaseInfo.phase.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {phaseInfo.phase.description}
                      </Typography>
                    )}
                    
                    {/* Phase Events */}
                    {(() => {
                      const phaseEvents = getPhaseEvents(phaseInfo.phase, plant.events);
                      const lastWatering = getDaysSinceLastEvent(phaseEvents, 'watering');
                      const lastFeeding = getDaysSinceLastEvent(phaseEvents, 'feeding');
                      
                      return (
                        <Box sx={{ mt: 1 }}>
                          {phaseEvents.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Events in this phase ({phaseEvents.length})
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {phaseEvents.slice(0, 5).map(event => (
                                  <Chip
                                    key={event.id}
                                    label={`${getEventIcon(event.type)} ${event.title}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.7rem',
                                      height: 20,
                                      borderColor: getEventColor(event.type),
                                      color: getEventColor(event.type)
                                    }}
                                  />
                                ))}
                                {phaseEvents.length > 5 && (
                                  <Chip
                                    label={`+${phaseEvents.length - 5} more`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          
                          {/* Care reminders for current phase */}
                          {phaseInfo.isCurrent && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {lastWatering !== null && (
                                <Typography variant="caption" color={lastWatering > 3 ? 'warning.main' : 'textSecondary'}>
                                  💧 {lastWatering === 0 ? 'Today' : `${lastWatering}d ago`}
                                </Typography>
                              )}
                              {lastFeeding !== null && (
                                <Typography variant="caption" color={lastFeeding > 7 ? 'warning.main' : 'textSecondary'}>
                                  🌱 {lastFeeding === 0 ? 'Today' : `${lastFeeding}d ago`}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                    
                    {phaseInfo.isOverdue && (
                      <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="warning.dark">
                          This phase is running longer than expected
                        </Typography>
                      </Box>
                    )}
                    
                    {phaseInfo.isCurrent && phaseInfo.progressPercentage > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Phase Progress: {Math.round(phaseInfo.progressPercentage)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={phaseInfo.progressPercentage} 
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

        {/* Date Edit Dialog */}
        <Dialog open={dateDialogOpen} onClose={() => setDateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit {selectedPhase ? timeline.find(p => p.phase.id === selectedPhase)?.phase.name : ''} Start Date
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <DatePicker
              label="Start Date"
              value={newDate}
              onChange={(date) => setNewDate(date)}
              slotProps={{ 
                textField: { fullWidth: true },
                actionBar: { actions: ['clear', 'today'] }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setNewDate(null);
                handleDateSave();
              }}
              color="error"
              disabled={updatePlantMutation.isPending}
            >
              Clear Date
            </Button>
            <Button 
              onClick={handleDateSave} 
              variant="contained"
              disabled={updatePlantMutation.isPending}
            >
              Save Date
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Phase Actions Menu */}
        <Menu
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {menuPhase && (
            <MenuItem 
              onClick={() => handleClearDate(menuPhase)}
              sx={{ color: 'error.main' }}
            >
              <ClearIcon sx={{ mr: 1 }} />
              Clear Date
            </MenuItem>
          )}
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicPlantTimeline;