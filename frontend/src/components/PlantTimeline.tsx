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
import { PlantPhase, Plant } from '../types/models';
import { useUpdatePlant } from '../hooks/usePlants';
import { generateTimeline, getCurrentPhase, getUpdateFieldForPhase, getNextPhase, isPhaseReadyForNext } from '../utils/timelineUtils';
import { format } from 'date-fns';

interface PlantTimelineProps {
  plant: Plant;
}

const PlantTimeline: React.FC<PlantTimelineProps> = ({ plant }) => {
  const [selectedPhase, setSelectedPhase] = useState<PlantPhase | null>(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuPhase, setMenuPhase] = useState<PlantPhase | null>(null);
  const updatePlantMutation = useUpdatePlant();
  
  const timeline = generateTimeline(plant);
  const currentPhase = getCurrentPhase(plant);
  const currentPhaseInfo = timeline.find(p => p.isCurrent);
  
  const totalProgress = timeline.filter(p => p.isCompleted).length / timeline.length * 100;
  const phaseProgress = currentPhaseInfo?.actualDate ? 
    Math.min((currentPhaseInfo.daysElapsed / currentPhaseInfo.duration) * 100, 100) : 0;
    
  const getCurrentStepIndex = () => {
    return timeline.findIndex(p => p.isCurrent);
  };

  const handlePhaseClick = (phase: PlantPhase) => {
    setSelectedPhase(selectedPhase === phase ? null : phase);
  };

  const handleDateEdit = (phase: PlantPhase, currentDate: Date | null) => {
    setSelectedPhase(phase);
    setNewDate(currentDate || new Date());
    setDateDialogOpen(true);
  };

  const handleDateSave = async () => {
    if (!selectedPhase) return;

    try {
      const updates: Partial<Plant> = {};
      const fieldToUpdate = getUpdateFieldForPhase(selectedPhase);
      
      // Set the date (null clears it, undefined removes the field)
      if (newDate === null) {
        (updates as any)[fieldToUpdate] = null;
      } else {
        (updates as any)[fieldToUpdate] = newDate;
      }
      
      // Update current phase based on what phases have dates
      const updatedPlant = { ...plant, ...updates };
      updates.current_phase = getCurrentPhase(updatedPlant as Plant);

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });

      setDateDialogOpen(false);
      setSelectedPhase(null);
      setNewDate(null);
    } catch (error) {
      console.error('Failed to update date:', error);
    }
  };
  
  const handleClearDate = async (phase: PlantPhase) => {
    try {
      const updates: Partial<Plant> = {};
      const fieldToUpdate = getUpdateFieldForPhase(phase);
      
      (updates as any)[fieldToUpdate] = null;
      updates.current_phase = getCurrentPhase({ ...plant, ...updates } as Plant);

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });
      
      setMenuAnchor(null);
      setMenuPhase(null);
    } catch (error) {
      console.error('Failed to clear date:', error);
    }
  };
  
  const handleStartNextPhase = async (phaseToAdvance: PlantPhase) => {
    const nextPhase = getNextPhase(phaseToAdvance);
    
    if (nextPhase) {
      const now = new Date();
      const updates: Partial<Plant> = {};
      const fieldToUpdate = getUpdateFieldForPhase(nextPhase);
      
      (updates as any)[fieldToUpdate] = now;
      updates.current_phase = nextPhase;

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, phase: PlantPhase) => {
    setMenuAnchor(event.currentTarget);
    setMenuPhase(phase);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPhase(null);
  };

  const activeStepIndex = selectedPhase ? timeline.findIndex(p => p.phase === selectedPhase) : getCurrentStepIndex();
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
            {currentPhaseInfo && isPhaseReadyForNext(currentPhaseInfo) && getNextPhase(currentPhaseInfo.phase) && (
              <Button
                size="small"
                variant="contained"
                startIcon={<StartIcon />}
                onClick={() => handleStartNextPhase(currentPhaseInfo.phase)}
              >
                Start Next Phase
              </Button>
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
            const isSelected = selectedPhase === phaseInfo.phase;
            
            return (
              <Step 
                key={phaseInfo.phase} 
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
                  onClick={() => handlePhaseClick(phaseInfo.phase)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        color: phaseInfo.isOverdue ? 'warning.main' : 'inherit',
                        fontWeight: phaseInfo.isCurrent ? 600 : 400
                      }}
                    >
                      {phaseInfo.label}
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
                        label={`Est. ${phaseInfo.duration} days`}
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
                          {phaseInfo.actualDate ? format(phaseInfo.actualDate, 'dd/MM/yy') : 'Not started'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Estimated
                        </Typography>
                        <Typography variant="body2">
                          {phaseInfo.estimatedDate ? format(phaseInfo.estimatedDate, 'dd/MM/yy') : 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDateEdit(phaseInfo.phase, phaseInfo.actualDate)}
                          title="Edit date"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, phaseInfo.phase)}
                          title="More options"
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {phaseInfo.isOverdue && (
                      <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="warning.dark">
                          This phase is running longer than expected
                        </Typography>
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
            Edit {selectedPhase ? timeline.find(p => p.phase === selectedPhase)?.label : ''} Start Date
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


export default PlantTimeline;