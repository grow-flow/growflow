import React, { useState } from 'react';
import { Grid, Typography, Card, CardContent, Button, Box, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon, LocalFlorist as PlantIcon } from '@mui/icons-material';
import { useGrowAreas, useCreateGrowArea } from '../hooks/useGrowAreas';
import { useCreatePlant } from '../hooks/usePlants';
import { GrowArea, Plant } from '../types/models';
import GrowAreaCard from '../components/GrowAreaCard';
import CreateGrowAreaDialog from '../components/CreateGrowAreaDialog';
import CreatePlantDialog from '../components/CreatePlantDialog';
import QuickStats from '../components/QuickStats';
import RecentActivities from '../components/RecentActivities';

const Dashboard: React.FC = () => {
  const [createGrowAreaDialogOpen, setCreateGrowAreaDialogOpen] = useState(false);
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  
  const { 
    data: growAreas = [], 
    isLoading, 
    error,
    refetch 
  } = useGrowAreas();
  
  const createGrowAreaMutation = useCreateGrowArea();
  const createPlantMutation = useCreatePlant();

  const handleGrowAreaCreated = async (growAreaData: Partial<GrowArea>) => {
    try {
      await createGrowAreaMutation.mutateAsync(growAreaData);
      setCreateGrowAreaDialogOpen(false);
    } catch (error) {
      console.error('Failed to create grow area:', error);
    }
  };

  const handlePlantCreated = async (plantData: Partial<Plant>) => {
    try {
      await createPlantMutation.mutateAsync(plantData);
      setCreatePlantDialogOpen(false);
    } catch (error) {
      console.error('Failed to create plant:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Failed to load grow areas. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PlantIcon />}
            onClick={() => setCreatePlantDialogOpen(true)}
            disabled={growAreas.length === 0}
          >
            Add Plant
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateGrowAreaDialogOpen(true)}
          >
            New Grow Area
          </Button>
        </Box>
      </Box>

      <QuickStats growAreas={growAreas} />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {growAreas.map((growArea) => (
              <Grid item xs={12} md={6} key={growArea.id}>
                <GrowAreaCard growArea={growArea} />
              </Grid>
            ))}
            
            {growAreas.length === 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No grow areas yet
                    </Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>
                      Create your first grow area to start tracking your plants
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateGrowAreaDialogOpen(true)}
                    >
                      Create Grow Area
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <RecentActivities />
        </Grid>
      </Grid>

      <CreateGrowAreaDialog
        open={createGrowAreaDialogOpen}
        onClose={() => setCreateGrowAreaDialogOpen(false)}
        onSuccess={handleGrowAreaCreated}
      />

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
        growAreaId={0} // Will be selected in dialog
      />
    </Box>
  );
};

export default Dashboard;