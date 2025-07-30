import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInDays } from 'date-fns';
import { Plant, PlantPhase } from '../types/models';
import { useUpdatePlant } from '../hooks/usePlants';

interface PhaseManagementDialogProps {
  open: boolean;
  onClose: () => void;
  plant: Plant | null;
}

const PhaseManagementDialog: React.FC<PhaseManagementDialogProps> = ({
  open,
  onClose,
  plant
}) => {
  const [autoMode, setAutoMode] = useState(true);
  const [customDates, setCustomDates] = useState({
    germination_date: plant?.germination_date ? new Date(plant.germination_date) : new Date(),
    vegetation_start_date: plant?.vegetation_start_date ? new Date(plant.vegetation_start_date) : null,
    flowering_start_date: plant?.flowering_start_date ? new Date(plant.flowering_start_date) : null,
  });
  const updatePlantMutation = useUpdatePlant();

  const phases = [
    { phase: PlantPhase.GERMINATION, label: 'Germination', days: 7 },
    { phase: PlantPhase.SEEDLING, label: 'Seedling', days: 14 },
    { phase: PlantPhase.VEGETATION, label: 'Vegetation', days: 42 },
    { phase: PlantPhase.PRE_FLOWER, label: 'Pre-Flower', days: 14 },
    { phase: PlantPhase.FLOWERING, label: 'Flowering', days: 63 },
    { phase: PlantPhase.FLUSHING, label: 'Flushing', days: 14 },
    { phase: PlantPhase.DRYING, label: 'Drying (Harvest)', days: 10 },
    { phase: PlantPhase.CURING, label: 'Curing', days: 28 }
  ];

  const getCurrentPhaseIndex = () => {
    if (!plant) return 0;
    return phases.findIndex(p => p.phase === plant.current_phase);
  };

  const calculateAutoDates = () => {
    if (!plant) return;
    
    const germDate = new Date(plant.germination_date);
    let currentDate = new Date(germDate);
    
    const dates = {
      germination_date: germDate,
      vegetation_start_date: null as Date | null,
      flowering_start_date: null as Date | null,
    };

    // Calculate automatic dates based on typical phase durations
    currentDate.setDate(currentDate.getDate() + 21); // Germination + Seedling
    dates.vegetation_start_date = new Date(currentDate);

    currentDate.setDate(currentDate.getDate() + 56); // Vegetation + Pre-flower
    dates.flowering_start_date = new Date(currentDate);


    return dates;
  };

  const handlePhaseChange = async (newPhase: PlantPhase) => {
    if (!plant) return;

    try {
      const updates: Partial<Plant> = {
        current_phase: newPhase
      };

      // Auto-set dates based on phase
      const now = new Date();
      if (newPhase === PlantPhase.VEGETATION && !plant.vegetation_start_date) {
        updates.vegetation_start_date = now;
      } else if (newPhase === PlantPhase.FLOWERING && !plant.flowering_start_date) {
        updates.flowering_start_date = now;
      } else if (newPhase === PlantPhase.DRYING && !plant.drying_start_date) {
        updates.drying_start_date = now;
      }

      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: updates
      });

      onClose();
    } catch (error) {
      console.error('Failed to update phase:', error);
    }
  };

  const handleCustomDatesSave = async () => {
    if (!plant) return;

    try {
      await updatePlantMutation.mutateAsync({
        id: plant.id,
        data: {
          germination_date: customDates.germination_date,
          vegetation_start_date: customDates.vegetation_start_date || undefined,
          flowering_start_date: customDates.flowering_start_date || undefined,
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to update dates:', error);
    }
  };

  const getDaysInPhase = (phase: PlantPhase) => {
    if (!plant) return 0;
    
    const now = new Date();
    let startDate: Date;

    switch (phase) {
      case PlantPhase.GERMINATION:
      case PlantPhase.SEEDLING:
        startDate = new Date(plant.germination_date);
        break;
      case PlantPhase.VEGETATION:
      case PlantPhase.PRE_FLOWER:
        startDate = plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : new Date(plant.germination_date);
        break;
      case PlantPhase.FLOWERING:
      case PlantPhase.FLUSHING:
        startDate = plant.flowering_start_date ? new Date(plant.flowering_start_date) : new Date(plant.germination_date);
        break;
      default:
        startDate = new Date(plant.germination_date);
    }

    return differenceInDays(now, startDate);
  };

  if (!plant) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Phase Management: {plant.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                />
              }
              label="Automatic Phase Management"
            />
          </Box>

          {autoMode ? (
            <>
              {/* Phase Stepper */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Growth Timeline
                </Typography>
                <Stepper activeStep={getCurrentPhaseIndex()} alternativeLabel>
                  {phases.map((phaseData, index) => (
                    <Step key={phaseData.phase} completed={index < getCurrentPhaseIndex()}>
                      <StepLabel>
                        <Typography variant="caption">
                          {phaseData.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Current Phase Info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Current Phase: {plant.current_phase}
                    </Typography>
                    <Chip 
                      label={`Day ${getDaysInPhase(plant.current_phase)}`}
                      color="primary"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Started: {plant.germination_date && format(new Date(plant.germination_date), 'MMM dd, yyyy')}
                  </Typography>
                </CardContent>
              </Card>

              {/* Phase Buttons */}
              <Typography variant="h6" gutterBottom>
                Change Phase
              </Typography>
              <Grid container spacing={2}>
                {phases.map((phaseData) => (
                  <Grid item xs={6} md={4} key={phaseData.phase}>
                    <Button
                      variant={plant.current_phase === phaseData.phase ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => handlePhaseChange(phaseData.phase)}
                      disabled={updatePlantMutation.isPending}
                      sx={{ 
                        textTransform: 'capitalize',
                        py: 1.5
                      }}
                    >
                      {phaseData.label}
                      <Typography variant="caption" display="block">
                        (~{phaseData.days} days)
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                Changing phases will automatically update relevant dates. This helps track your plant's progress accurately.
              </Alert>
            </>
          ) : (
            <>
              {/* Manual Date Management */}
              <Typography variant="h6" gutterBottom>
                Custom Date Management
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Germination Date"
                    value={customDates.germination_date}
                    onChange={(date) => setCustomDates({ ...customDates, germination_date: date || new Date() })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Vegetation Start"
                    value={customDates.vegetation_start_date}
                    onChange={(date) => setCustomDates({ ...customDates, vegetation_start_date: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Flowering Start"
                    value={customDates.flowering_start_date}
                    onChange={(date) => setCustomDates({ ...customDates, flowering_start_date: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 2 }}>
                Manual mode gives you full control over phase dates but disables automatic phase transitions.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          {!autoMode && (
            <Button 
              onClick={handleCustomDatesSave}
              variant="contained"
              disabled={updatePlantMutation.isPending}
            >
              Save Dates
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PhaseManagementDialog;