import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CheckCircle as CompleteIcon,
  PlayArrow as CurrentIcon,
  Schedule as PendingIcon,
  FastForward as NextIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Plant, PlantPhase } from '../types/models';
import { useUpdatePlant, usePlant } from '../hooks/usePlants';
import { useStrains } from '../hooks/useStrains';
import { generateTimeline, getCurrentPhase, getUpdateFieldForPhase, getNextPhase, isPhaseReadyForNext, PHASE_ORDER, validatePhaseDate, getPhaseDate } from '../utils/timelineUtils';

interface SimpleTimelineProps {
  plant: Plant;
}



const SimpleTimeline: React.FC<SimpleTimelineProps> = ({ plant: initialPlant }) => {
  const updatePlantMutation = useUpdatePlant();
  
  // Use the latest plant data from React Query to ensure updates are reflected
  const { data: freshPlant } = usePlant(initialPlant.id);
  const plant = freshPlant || initialPlant;
  
  // Get strain data for accurate timeline calculations
  const { data: strains = [] } = useStrains();
  const strain = strains.find(s => s.name === plant.strain);

  const timeline = generateTimeline(plant, strain);
  const currentPhase = getCurrentPhase(plant);
  const currentPhaseInfo = timeline.find(p => p.isCurrent);

  const handleDateChange = async (phase: PlantPhase, date: Date | null) => {
    // Validate the date (null dates are allowed for clearing)
    const validation = validatePhaseDate(date, phase, plant);
    if (!validation.isValid) {
      console.warn('Invalid date:', validation.error);
      return;
    }

    try {
      const updates: Partial<Plant> = {};
      const fieldToUpdate = getUpdateFieldForPhase(phase);
      
      (updates as any)[fieldToUpdate] = date;
      
      // Create a temporary plant object with all current data plus the new update
      const tempPlant = { 
        ...plant,
        [fieldToUpdate]: date
      } as Plant;
      
      // Calculate the new current phase based on all phase dates
      const newCurrentPhase = getCurrentPhase(tempPlant);
      updates.current_phase = newCurrentPhase;

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });
    } catch (error) {
      console.error('Failed to update date:', error);
    }
  };

  const handleStartNextPhase = async (phaseToAdvance: PlantPhase) => {
    const nextPhase = getNextPhase(phaseToAdvance);
    
    if (nextPhase) {
      await handleDateChange(nextPhase, new Date());
    }
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                    <DatePicker
                      label={phase.label}
                      value={phase.actualDate}
                      onChange={(date) => handleDateChange(phase.phase, date)}
                      maxDate={(() => {
                        // Max date is today or the next phase's date (whichever is earlier)
                        const today = new Date();
                        const phaseIndex = PHASE_ORDER.indexOf(phase.phase);
                        
                        // Find the earliest next phase date
                        for (let i = phaseIndex + 1; i < PHASE_ORDER.length; i++) {
                          const nextPhaseDate = getPhaseDate(plant, PHASE_ORDER[i]);
                          if (nextPhaseDate) {
                            // Subtract 1 day to ensure this phase can't be on or after next phase
                            const maxAllowed = new Date(nextPhaseDate);
                            maxAllowed.setDate(maxAllowed.getDate() - 1);
                            return maxAllowed < today ? maxAllowed : today;
                          }
                        }
                        return today;
                      })()}
                      minDate={(() => {
                        // Min date is the latest previous phase's date
                        const phaseIndex = PHASE_ORDER.indexOf(phase.phase);
                        for (let i = phaseIndex - 1; i >= 0; i--) {
                          const prevPhaseDate = getPhaseDate(plant, PHASE_ORDER[i]);
                          if (prevPhaseDate) {
                            return prevPhaseDate;
                          }
                        }
                        return undefined; // No minimum for first phase
                      })()}
                      format="dd/MM/yy"
                      slotProps={{ 
                        textField: { 
                          size: 'small',
                          variant: 'outlined',
                          sx: { minWidth: 140 }
                        },
                        actionBar: { 
                          actions: ['clear', 'today']
                        }
                      }}
                    />
                    
                    {!phase.actualDate && isPhaseReadyForNext(phase) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<NextIcon />}
                        onClick={() => handleDateChange(phase.phase, new Date())}
                        disabled={updatePlantMutation.isPending}
                        sx={{ ml: 1 }}
                      >
                        Start
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default SimpleTimeline;