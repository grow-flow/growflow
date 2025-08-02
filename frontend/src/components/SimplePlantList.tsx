import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Grid
} from '@mui/material';
import { Plant } from '../types/models';
import { format } from 'date-fns';

interface SimplePlantListProps {
  plants: Plant[];
}

const SimplePlantList: React.FC<SimplePlantListProps> = ({ plants }) => {
  const getCurrentPhaseName = (plant: Plant): string => {
    let lastStartedIndex = -1;
    for (let i = 0; i < plant.phases.length; i++) {
      if (plant.phases[i].start_date) {
        lastStartedIndex = i;
      }
    }
    const currentPhase = lastStartedIndex >= 0 ? plant.phases[lastStartedIndex] : null;
    return currentPhase?.name || 'Unknown';
  };

  const getPlantStartDate = (plant: Plant): string => {
    const firstPhase = plant.phases.find(p => p.start_date);
    return firstPhase?.start_date ? format(new Date(firstPhase.start_date), 'MMM dd, yyyy') : 'Unknown';
  };

  const getDaysInCurrentPhase = (plant: Plant): number => {
    let lastStartedIndex = -1;
    for (let i = 0; i < plant.phases.length; i++) {
      if (plant.phases[i].start_date) {
        lastStartedIndex = i;
      }
    }
    const currentPhase = lastStartedIndex >= 0 ? plant.phases[lastStartedIndex] : null;
    if (!currentPhase?.start_date) return 0;
    
    const now = new Date();
    const startDate = new Date(currentPhase.start_date);
    return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Plants ({plants.length})
      </Typography>
      
      <Grid container spacing={2}>
        {plants.map((plant) => (
          <Grid item xs={12} sm={6} md={4} key={plant.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {plant.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={getCurrentPhaseName(plant)}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={plant.strain}
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={plant.medium}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Started: {getPlantStartDate(plant)}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Day {getDaysInCurrentPhase(plant)} in {getCurrentPhaseName(plant)}
                </Typography>

                <Typography variant="body2" color="textSecondary">
                  {plant.events.length} events logged
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimplePlantList;