import React, { useState, useMemo } from 'react';
import { Grid, Typography, Card, CardContent, CardMedia, Button, Box, Alert, Paper, Chip, Avatar, LinearProgress, CardActionArea } from '@mui/material';
import { Add as AddIcon, LocalFlorist as PlantIcon, Timeline, Speed, TrendingUp, LocalFlorist } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePlants, useCreatePlant } from '../hooks/usePlants';
import { Plant, CreatePlantRequest } from '../types/models';
import CreatePlantDialog from '../components/CreatePlantDialog';
import { createPlantTimeline } from '../utils/PlantTimeline';
import { getPhotoUrl } from '../services/api';

const getLatestPhoto = (plant: Plant): string | null => {
  const sorted = [...(plant.events || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  for (const event of sorted) {
    if (event.data?.photos?.length) return getPhotoUrl(event.data.photos[0]);
  }
  return null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);

  const {
    data: allPlants = [],
    error,
    refetch
  } = usePlants();
  
  const createPlantMutation = useCreatePlant();

  const plantStats = useMemo(() => {
    const totalPlants = allPlants.length;
    const activePlants = allPlants.filter(p => p.isActive).length;
    const phaseCounts = allPlants.reduce((acc, plant) => {
      const timeline = createPlantTimeline(plant.phases || [], plant.events || []);
      const currentPhase = timeline.currentPhase?.name || 'Unknown';
      acc[currentPhase] = (acc[currentPhase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalGrowthDays = allPlants
      .filter(p => p.isActive)
      .reduce((sum, plant) => {
        const firstPhase = plant.phases?.[0];
        if (firstPhase?.startDate) {
          const start = new Date(firstPhase.startDate);
          const daysSinceStart = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return sum + daysSinceStart;
        }
        return sum;
      }, 0);

    return { totalPlants, activePlants, phaseCounts, totalGrowthDays };
  }, [allPlants]);

  const { totalPlants, activePlants, phaseCounts, totalGrowthDays } = plantStats;

  const handlePlantCreated = async (plantData: CreatePlantRequest) => {
    try {
      await createPlantMutation.mutateAsync(plantData);
      setCreatePlantDialogOpen(false);
    } catch (error) {
      console.error('Failed to create plant:', error);
    }
  };

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
        <Typography variant="h4">GrowFlow Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlantIcon />}
            onClick={() => setCreatePlantDialogOpen(true)}
          >
            Add Plant
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <LocalFlorist />
            </Avatar>
            <Box>
              <Typography variant="h4">{activePlants}</Typography>
              <Typography variant="body2" color="textSecondary">
                Active Plants
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <Timeline />
            </Avatar>
            <Box>
              <Typography variant="h4">{totalPlants}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Plants
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Speed />
            </Avatar>
            <Box>
              <Typography variant="h4">{Object.keys(phaseCounts).length}</Typography>
              <Typography variant="body2" color="textSecondary">
                Active Phases
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <TrendingUp />
            </Avatar>
            <Box>
              <Typography variant="h4">{totalGrowthDays}</Typography>
              <Typography variant="body2" color="textSecondary">
                Growth Days
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Plants Overview */}
        <Grid item xs={12} lg={8}>
          <Typography variant="h5" gutterBottom>
            Recent Plants
          </Typography>
          {allPlants.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <LocalFlorist sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No plants yet
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 3 }}>
                  Create your first plant to start tracking growth
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreatePlantDialogOpen(true)}
                >
                  Add Plant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {allPlants.slice(0, 6).map((plant) => {
                const timeline = createPlantTimeline(plant.phases, plant.events || []);
                const currentPhaseInfo = timeline.flatTimeline.find(p => p.isCurrent);
                const currentPhase = currentPhaseInfo?.phase;
                const daysInPhase = currentPhaseInfo?.daysElapsed || 0;
                
                const photoUrl = getLatestPhoto(plant);
                return (
                  <Grid item xs={12} md={6} key={plant.id}>
                    <Card>
                      <CardActionArea onClick={() => navigate(`/plant/${plant.id}`)}>
                        {photoUrl ? (
                          <CardMedia component="img" height={180} image={photoUrl} alt={plant.name} sx={{ objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ height: 180, bgcolor: 'grey.900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LocalFlorist sx={{ fontSize: 56, color: 'grey.700' }} />
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{plant.name}</Typography>
                            <Chip
                              label={plant.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={plant.isActive ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                          <Typography color="textSecondary" gutterBottom>
                            {plant.strain?.name || 'Unknown Strain'}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {currentPhase?.name || 'No current phase'} · Day {daysInPhase}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
        
        {/* Phase Distribution & Stats */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Phase Distribution
            </Typography>
            {Object.keys(phaseCounts).length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(() => {
                  const maxCount = Math.max(...Object.values(phaseCounts));
                  return Object.entries(phaseCounts).map(([phase, count]) => (
                    <Box key={phase}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{phase}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / maxCount) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ));
                })()}
              </Box>
            ) : (
              <Typography color="textSecondary">
                No active phases
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
      />
    </Box>
  );
};

export default Dashboard;