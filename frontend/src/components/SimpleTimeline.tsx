import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as CurrentIcon,
  Schedule as PendingIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  FastForward as NextIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Plant, PlantPhase } from '../types/models';
import { useUpdatePlant } from '../hooks/usePlants';
import { generateTimeline, getCurrentPhase, getUpdateFieldForPhase, getNextPhase, isPhaseReadyForNext, PHASE_ORDER } from '../utils/timelineUtils';

interface SimpleTimelineProps {
  plant: Plant;
}



const SimpleTimeline: React.FC<SimpleTimelineProps> = ({ plant }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<PlantPhase | null>(null);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuPhase, setMenuPhase] = useState<PlantPhase | null>(null);
  const updatePlantMutation = useUpdatePlant();

  const timeline = generateTimeline(plant);
  const currentPhase = getCurrentPhase(plant);
  const currentPhaseInfo = timeline.find(p => p.isCurrent);

  const handleEditDate = (phase: PlantPhase, currentDate: Date | null) => {
    setSelectedPhase(phase);
    setEditDate(currentDate || new Date());
    setEditDialogOpen(true);
  };


  const handleSaveDate = async () => {
    if (!selectedPhase) return;

    try {
      const updates: Partial<Plant> = {};
      const fieldToUpdate = getUpdateFieldForPhase(selectedPhase);
      
      // Set the date (null clears it, undefined removes the field)
      if (editDate === null) {
        (updates as any)[fieldToUpdate] = null;
      } else {
        (updates as any)[fieldToUpdate] = editDate;
      }
      
      // Update current phase based on what phases have dates
      const updatedPlant = { ...plant, ...updates };
      updates.current_phase = getCurrentPhase(updatedPlant as Plant);

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });

      setEditDialogOpen(false);
      setSelectedPhase(null);
      setEditDate(null);
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

      setMenuAnchor(null);
      setMenuPhase(null);
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

  const progressPercent = currentPhaseInfo?.actualDate ? 
    Math.min((currentPhaseInfo.daysElapsed / currentPhaseInfo.duration) * 100, 100) : 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Growth Timeline
        </Typography>

        {/* Current Status */}
        {currentPhaseInfo && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CurrentIcon />
                <Typography variant="h6">
                  Currently: {currentPhaseInfo.label}
                </Typography>
              </Box>
              
              {currentPhaseInfo.actualDate && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      Day {currentPhaseInfo.daysElapsed} of ~{currentPhaseInfo.duration} 
                      ({Math.max(0, currentPhaseInfo.duration - currentPhaseInfo.daysElapsed)} days remaining)
                    </Typography>
                    {isPhaseReadyForNext(currentPhaseInfo) && getNextPhase(currentPhaseInfo.phase) && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<StartIcon />}
                        onClick={() => handleStartNextPhase(currentPhaseInfo.phase)}
                        sx={{ ml: 2 }}
                      >
                        Start Next Phase
                      </Button>
                    )}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercent}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'primary.contrastText'
                      }
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Phase List */}
        <Stack spacing={2}>
          {timeline.map((phase) => (
            <Card 
              key={phase.phase}
              sx={{ 
                opacity: phase.isCompleted ? 0.8 : 1,
                border: phase.isCurrent ? '2px solid' : '1px solid',
                borderColor: phase.isCurrent ? 'primary.main' : 'divider'
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {phase.isCompleted && <CompleteIcon color="success" />}
                    {phase.isCurrent && <CurrentIcon color="primary" />}
                    {!phase.isCompleted && !phase.isCurrent && <PendingIcon color="disabled" />}
                    
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: phase.isCurrent ? 600 : 400 }}>
                        {phase.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {phase.actualDate ? (
                          <Typography variant="body2" color="textSecondary">
                            Started: {format(phase.actualDate, 'dd/MM/yy')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Not started
                          </Typography>
                        )}
                        
                        <Chip 
                          label={`${phase.duration} days`} 
                          size="small" 
                          variant="outlined"
                        />
                        
                        {phase.isCompleted && (
                          <Chip 
                            label={`Took ${phase.daysElapsed} days`} 
                            size="small" 
                            color={phase.daysElapsed > phase.duration * 1.2 ? 'warning' : 'success'}
                          />
                        )}
                        
                        {phase.isCurrent && phase.actualDate && (
                          <Chip 
                            label={`${Math.max(0, phase.duration - phase.daysElapsed)} days left`} 
                            size="small" 
                            color="primary"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleEditDate(phase.phase, phase.actualDate)}
                      title="Edit start date"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, phase.phase)}
                      title="More options"
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Edit Date Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>
            Set Start Date: {selectedPhase ? timeline.find(p => p.phase === selectedPhase)?.label : ''}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <DatePicker
              label="Start Date"
              value={editDate}
              onChange={(date) => setEditDate(date)}
              slotProps={{ 
                textField: { fullWidth: true },
                actionBar: { actions: ['clear', 'today'] }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setEditDate(null);
                handleSaveDate();
              }}
              color="error"
              disabled={updatePlantMutation.isPending}
            >
              Clear Date
            </Button>
            <Button 
              onClick={handleSaveDate} 
              variant="contained"
              disabled={updatePlantMutation.isPending}
            >
              Save
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
            <>
              {menuPhase === currentPhase && (
                <>
                  <MenuItem 
                    onClick={() => handleStartNextPhase(menuPhase)}
                  >
                    <NextIcon sx={{ mr: 1 }} />
                    Start Next Phase
                  </MenuItem>
                  <Divider />
                </>
              )}
              <MenuItem 
                onClick={() => handleClearDate(menuPhase)}
                sx={{ color: 'error.main' }}
              >
                <ClearIcon sx={{ mr: 1 }} />
                Clear Date
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default SimpleTimeline;