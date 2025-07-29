import React, { useState } from 'react';
import { Grid, Typography, Card, CardContent, Button, Box, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon, LocalFlorist as PlantIcon } from '@mui/icons-material';
import { useGrowboxes, useCreateGrowbox } from '../hooks/useGrowboxes';
import { useCreatePlant } from '../hooks/usePlants';
import { Growbox, Plant } from '../types/models';
import GrowboxCard from '../components/GrowboxCard';
import CreateGrowboxDialog from '../components/CreateGrowboxDialog';
import CreatePlantDialog from '../components/CreatePlantDialog';
import QuickStats from '../components/QuickStats';
import RecentActivities from '../components/RecentActivities';

const Dashboard: React.FC = () => {
  const [createGrowboxDialogOpen, setCreateGrowboxDialogOpen] = useState(false);
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  
  const { 
    data: growboxes = [], 
    isLoading, 
    error,
    refetch 
  } = useGrowboxes();
  
  const createGrowboxMutation = useCreateGrowbox();
  const createPlantMutation = useCreatePlant();

  const handleGrowboxCreated = async (growboxData: Partial<Growbox>) => {
    try {
      await createGrowboxMutation.mutateAsync(growboxData);
      setCreateGrowboxDialogOpen(false);
    } catch (error) {
      console.error('Failed to create growbox:', error);
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
        Failed to load growboxes. Please try again.
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
            disabled={growboxes.length === 0}
          >
            Add Plant
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateGrowboxDialogOpen(true)}
          >
            New Growbox
          </Button>
        </Box>
      </Box>

      <QuickStats growboxes={growboxes} />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {growboxes.map((growbox) => (
              <Grid item xs={12} md={6} key={growbox.id}>
                <GrowboxCard growbox={growbox} />
              </Grid>
            ))}
            
            {growboxes.length === 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No growboxes yet
                    </Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>
                      Create your first growbox to start tracking your plants
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateGrowboxDialogOpen(true)}
                    >
                      Create Growbox
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

      <CreateGrowboxDialog
        open={createGrowboxDialogOpen}
        onClose={() => setCreateGrowboxDialogOpen(false)}
        onSuccess={handleGrowboxCreated}
      />

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
        growboxId={0} // Will be selected in dialog
      />
    </Box>
  );
};

export default Dashboard;