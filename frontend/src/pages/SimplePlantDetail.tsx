import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { usePlant } from '../hooks/usePlants';
import DynamicPlantTimeline from '../components/DynamicPlantTimeline';

const SimplePlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plant, isLoading, error } = usePlant(parseInt(id || '0'));

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !plant) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          Failed to load plant details
        </Typography>
      </Box>
    );
  }

  const getCurrentPhaseName = (): string => {
    const currentPhase = plant.phases.find(phase => phase.is_active);
    return currentPhase?.name || 'Unknown';
  };

  const getTotalDays = (): number => {
    const firstPhase = plant.phases.find(p => p.start_date);
    if (!firstPhase?.start_date) return 0;
    
    const start = new Date(firstPhase.start_date);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {plant.name}
        </Typography>
      </Box>

      {/* Plant Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Plant Information
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={getCurrentPhaseName()} color="primary" />
              <Chip label={plant.strain} variant="outlined" />
              <Chip label={plant.medium} variant="outlined" />
              {plant.breeder && <Chip label={plant.breeder} variant="outlined" />}
            </Box>

            <Typography variant="body2" color="textSecondary" gutterBottom>
              Total grow time: {getTotalDays()} days
            </Typography>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Pot size: {plant.pot_size_liters}L
            </Typography>

            <Typography variant="body2" color="textSecondary" gutterBottom>
              Events logged: {plant.events.length}
            </Typography>

            {plant.notes && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Notes:</strong> {plant.notes}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Light Schedule
            </Typography>
            <Typography variant="body2" gutterBottom>
              Vegetation: {plant.light_schedule.vegetation}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Flowering: {plant.light_schedule.flowering}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Timeline */}
      <Paper sx={{ p: 3 }}>
        <DynamicPlantTimeline plant={plant} />
      </Paper>
    </Box>
  );
};

export default SimplePlantDetail;