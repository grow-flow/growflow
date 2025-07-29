import React, { useState } from 'react';
import { Grid, Typography, Card, CardContent, Button, Box, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useGrowboxes, useCreateGrowbox } from '../hooks/useGrowboxes';
import { Growbox } from '../types/models';
import GrowboxCard from '../components/GrowboxCard';
import CreateGrowboxDialog from '../components/CreateGrowboxDialog';
import QuickStats from '../components/QuickStats';
import RecentActivities from '../components/RecentActivities';

const Dashboard: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { 
    data: growboxes = [], 
    isLoading, 
    error,
    refetch 
  } = useGrowboxes();
  
  const createGrowboxMutation = useCreateGrowbox();

  const handleGrowboxCreated = async (growboxData: Partial<Growbox>) => {
    try {
      await createGrowboxMutation.mutateAsync(growboxData);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create growbox:', error);
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Growbox
        </Button>
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
                      onClick={() => setCreateDialogOpen(true)}
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
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleGrowboxCreated}
      />
    </Box>
  );
};

export default Dashboard;