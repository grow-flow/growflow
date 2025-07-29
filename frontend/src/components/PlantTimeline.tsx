import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepContent, Chip } from '@mui/material';
import { PlantPhase } from '../types/models';

interface PlantTimelineProps {
  currentPhase: PlantPhase;
  germinationDate: Date;
  vegetationStartDate?: Date;
  floweringStartDate?: Date;
  harvestDate?: Date;
}

const PlantTimeline: React.FC<PlantTimelineProps> = ({
  currentPhase,
  germinationDate,
  vegetationStartDate,
  floweringStartDate,
  harvestDate
}) => {
  const phases = [
    { phase: PlantPhase.GERMINATION, label: 'Germination', date: germinationDate },
    { phase: PlantPhase.SEEDLING, label: 'Seedling', date: germinationDate },
    { phase: PlantPhase.VEGETATION, label: 'Vegetation', date: vegetationStartDate },
    { phase: PlantPhase.PRE_FLOWER, label: 'Pre-Flower', date: vegetationStartDate },
    { phase: PlantPhase.FLOWERING, label: 'Flowering', date: floweringStartDate },
    { phase: PlantPhase.FLUSHING, label: 'Flushing', date: floweringStartDate },
    { phase: PlantPhase.HARVEST, label: 'Harvest', date: harvestDate },
    { phase: PlantPhase.DRYING, label: 'Drying', date: harvestDate },
    { phase: PlantPhase.CURING, label: 'Curing', date: harvestDate }
  ];

  const getCurrentStepIndex = () => {
    return phases.findIndex(p => p.phase === currentPhase);
  };

  const getDaysInPhase = (phase: PlantPhase, startDate?: Date) => {
    if (!startDate) return 0;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseStatus = (phase: PlantPhase) => {
    const currentIndex = getCurrentStepIndex();
    const phaseIndex = phases.findIndex(p => p.phase === phase);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>Growth Timeline</Typography>
      
      <Stepper activeStep={getCurrentStepIndex()} orientation="vertical">
        {phases.map((phaseData, index) => {
          const status = getPhaseStatus(phaseData.phase);
          const daysInPhase = phaseData.date ? getDaysInPhase(phaseData.phase, phaseData.date) : 0;
          
          return (
            <Step key={phaseData.phase} completed={status === 'completed'}>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1">{phaseData.label}</Typography>
                  {status === 'active' && (
                    <Chip
                      label={`Day ${daysInPhase}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  {status === 'completed' && phaseData.date && (
                    <Chip
                      label={`${daysInPhase} days`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ pb: 2 }}>
                  {phaseData.date && (
                    <Typography variant="caption" color="textSecondary">
                      Started: {phaseData.date.toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {getPhaseDescription(phaseData.phase)}
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

const getPhaseDescription = (phase: PlantPhase): string => {
  switch (phase) {
    case PlantPhase.GERMINATION:
      return 'Seeds are sprouting and developing first roots.';
    case PlantPhase.SEEDLING:
      return 'First leaves are developing, plant is establishing.';
    case PlantPhase.VEGETATION:
      return 'Rapid growth phase, developing strong structure.';
    case PlantPhase.PRE_FLOWER:
      return 'Transition phase, showing first signs of flowering.';
    case PlantPhase.FLOWERING:
      return 'Producing buds, main flowering period.';
    case PlantPhase.FLUSHING:
      return 'Final weeks, removing nutrients for better taste.';
    case PlantPhase.HARVEST:
      return 'Cutting and initial processing.';
    case PlantPhase.DRYING:
      return 'Drying buds in controlled environment.';
    case PlantPhase.CURING:
      return 'Final curing process for optimal quality.';
    default:
      return '';
  }
};

export default PlantTimeline;