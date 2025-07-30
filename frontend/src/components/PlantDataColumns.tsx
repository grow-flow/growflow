import React from 'react';
import { Grid, Paper, Typography, Box, Chip, LinearProgress, Card, CardContent } from '@mui/material';
import { LocalFlorist, Schedule, Opacity, Restaurant } from '@mui/icons-material';
import { Plant } from '../types/models';
import { format, differenceInDays } from 'date-fns';

interface PlantDataColumnsProps {
  plants: Plant[];
}

const PlantDataColumns: React.FC<PlantDataColumnsProps> = ({ plants }) => {
  const activePlants = plants.filter(p => p.is_active);

  const getDaysInPhase = (plant: Plant) => {
    const now = new Date();
    let startDate: Date;

    switch (plant.current_phase) {
      case 'germination':
      case 'seedling':
        startDate = new Date(plant.germination_date);
        break;
      case 'vegetation':
      case 'pre_flower':
        startDate = plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : new Date(plant.germination_date);
        break;
      case 'flowering':
      case 'flushing':
        startDate = plant.flowering_start_date ? new Date(plant.flowering_start_date) : new Date(plant.germination_date);
        break;
      default:
        startDate = new Date(plant.germination_date);
    }

    return differenceInDays(now, startDate);
  };

  const getTotalDays = (plant: Plant) => {
    return differenceInDays(new Date(), new Date(plant.germination_date));
  };

  const getPhaseProgress = (plant: Plant) => {
    const daysInPhase = getDaysInPhase(plant);
    const expectedDays = getExpectedPhaseDays(plant.current_phase);
    return Math.min((daysInPhase / expectedDays) * 100, 100);
  };

  const getExpectedPhaseDays = (phase: string) => {
    switch (phase) {
      case 'germination': return 7;
      case 'seedling': return 14;
      case 'vegetation': return 42;
      case 'pre_flower': return 14;
      case 'flowering': return 63;
      case 'flushing': return 14;
      default: return 30;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'germination': return 'success';
      case 'seedling': return 'success';
      case 'vegetation': return 'primary';
      case 'pre_flower': return 'warning';
      case 'flowering': return 'secondary';
      case 'flushing': return 'info';
      default: return 'default';
    }
  };

  if (activePlants.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No active plants in this growbox
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Plant Overview Column */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Plant Overview
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activePlants.map((plant) => (
              <Card key={plant.id} variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocalFlorist fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {plant.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {plant.strain}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={plant.current_phase}
                      size="small"
                      color={getPhaseColor(plant.current_phase) as any}
                    />
                    <Chip 
                      label={`${plant.medium}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Phase Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={getPhaseProgress(plant)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Typography variant="caption" color="textSecondary">
                    Day {getDaysInPhase(plant)} in {plant.current_phase} • Total: {getTotalDays(plant)} days
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Timeline Column */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Growth Timeline
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {activePlants.map((plant) => (
              <Box key={plant.id}>
                <Typography variant="subtitle2" gutterBottom>
                  {plant.name}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      Started: {format(new Date(plant.germination_date), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  
                  {plant.vegetation_start_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Veg: {format(new Date(plant.vegetation_start_date), 'MMM dd')}
                      </Typography>
                    </Box>
                  )}
                  
                  {plant.flowering_start_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Flower: {format(new Date(plant.flowering_start_date), 'MMM dd')}
                      </Typography>
                    </Box>
                  )}
                  
                  {plant.drying_start_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Harvested: {format(new Date(plant.drying_start_date), 'MMM dd')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Care Schedule Column */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Care Schedule
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activePlants.map((plant) => (
              <Card key={plant.id} variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {plant.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Opacity fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Last watered: 2 days ago
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Restaurant fontSize="small" color="secondary" />
                      <Typography variant="body2">
                        Last fed: 4 days ago
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                      Next watering: Tomorrow
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PlantDataColumns;