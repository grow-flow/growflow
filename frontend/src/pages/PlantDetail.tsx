import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Opacity, 
  Restaurant 
} from '@mui/icons-material';
import { usePlant, useLogWatering, useLogFeeding } from '../hooks/usePlants';
import { PlantPhase, WateringLog, FeedingLog, ObservationLog } from '../types/models';
import SimpleTimeline from '../components/SimpleTimeline';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const plantId = id ? parseInt(id) : 0;
  
  const { data: plant, isLoading, error } = usePlant(plantId);
  
  const [tabValue, setTabValue] = useState(0);
  const [careHistory] = useState<{
    watering: WateringLog[];
    feeding: FeedingLog[];
    observations: ObservationLog[];
  }>({ watering: [], feeding: [], observations: [] });
  const [quickActionDialog, setQuickActionDialog] = useState<'water' | 'feed' | null>(null);
  
  const logWateringMutation = useLogWatering();
  const logFeedingMutation = useLogFeeding();

  const handleQuickAction = async (action: 'water' | 'feed') => {
    if (!plant) return;
    
    try {
      if (action === 'water') {
        await logWateringMutation.mutateAsync({
          plant_id: plant.id,
          amount_ml: 500,
          ph_level: 6.2,
          notes: 'Quick watering'
        });
      } else {
        await logFeedingMutation.mutateAsync({
          plant_id: plant.id,
          nutrients: [{ name: 'Base Nutrients', amount_ml: 10 }],
          ph_level: 6.0,
          notes: 'Quick feeding'
        });
      }
      
      setQuickActionDialog(null);
    } catch (error) {
      console.error(`Failed to log ${action}:`, error);
    }
  };

  const getDaysInCurrentPhase = () => {
    if (!plant) return 0;
    const phaseStartDate = getPhaseStartDate();
    if (!phaseStartDate) return 0;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - phaseStartDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseStartDate = (): Date | null => {
    if (!plant) return null;
    
    switch (plant.current_phase) {
      case PlantPhase.GERMINATION:
      case PlantPhase.SEEDLING:
        return new Date(plant.germination_date);
      case PlantPhase.VEGETATION:
      case PlantPhase.PRE_FLOWER:
        return plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : null;
      case PlantPhase.FLOWERING:
      case PlantPhase.FLUSHING:
        return plant.flowering_start_date ? new Date(plant.flowering_start_date) : null;
      default:
        return null;
    }
  };

  const getTotalDays = () => {
    if (!plant) return 0;
    const now = new Date();
    const start = new Date(plant.germination_date);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error loading plant</Typography>;
  if (!plant) return <Typography>Plant not found</Typography>;

  return (
    <Box>
      {/* Plant Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>{plant.name}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={plant.strain} color="primary" />
              <Chip label={plant.current_phase} color="secondary" />
              <Chip label={plant.medium} variant="outlined" />
              {plant.is_mother_plant && <Chip label="Mother Plant" color="success" />}
            </Box>
            <Typography color="textSecondary">
              Day {getDaysInCurrentPhase()} in {plant.current_phase} • Total: {getTotalDays()} days
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Opacity />}
                onClick={() => setQuickActionDialog('water')}
                fullWidth
              >
                Water Now
              </Button>
              <Button
                variant="outlined"
                startIcon={<Restaurant />}
                onClick={() => setQuickActionDialog('feed')}
                fullWidth
              >
                Feed Now
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Timeline */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <SimpleTimeline plant={plant} />
          </Paper>
        </Grid>

        {/* Care History Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Watering (${careHistory.watering.length})`} />
              <Tab label={`Feeding (${careHistory.feeding.length})`} />
              <Tab label={`Observations (${careHistory.observations.length})`} />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {careHistory.watering.map((log) => (
                  <Card key={log.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2">
                        {new Date(log.timestamp).toLocaleDateString()} - {log.amount_ml}ml
                      </Typography>
                      {log.ph_level && <Typography variant="body2">pH: {log.ph_level}</Typography>}
                      {log.ec_ppm && <Typography variant="body2">EC: {log.ec_ppm} ppm</Typography>}
                      {log.notes && <Typography variant="body2" color="textSecondary">{log.notes}</Typography>}
                    </CardContent>
                  </Card>
                ))}
                {careHistory.watering.length === 0 && (
                  <Typography color="textSecondary">No watering logs yet</Typography>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {careHistory.feeding.map((log) => (
                  <Card key={log.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </Typography>
                      {log.nutrients.map((nutrient, index) => (
                        <Typography key={index} variant="body2">
                          {nutrient.name}: {nutrient.amount_ml}ml
                        </Typography>
                      ))}
                      {log.ph_level && <Typography variant="body2">pH: {log.ph_level}</Typography>}
                      {log.notes && <Typography variant="body2" color="textSecondary">{log.notes}</Typography>}
                    </CardContent>
                  </Card>
                ))}
                {careHistory.feeding.length === 0 && (
                  <Typography color="textSecondary">No feeding logs yet</Typography>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {careHistory.observations.map((log) => (
                  <Card key={log.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </Typography>
                        <Chip 
                          label={log.observation_type} 
                          size="small"
                          color={log.severity === 'high' ? 'error' : log.severity === 'medium' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2">{log.description}</Typography>
                    </CardContent>
                  </Card>
                ))}
                {careHistory.observations.length === 0 && (
                  <Typography color="textSecondary">No observations yet</Typography>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Action Dialogs */}
      <Dialog open={quickActionDialog === 'water'} onClose={() => setQuickActionDialog(null)}>
        <DialogTitle>Quick Watering</DialogTitle>
        <DialogContent>
          <TextField label="Amount (ml)" defaultValue="500" fullWidth sx={{ mb: 2 }} />
          <TextField label="pH Level" defaultValue="6.2" fullWidth sx={{ mb: 2 }} />
          <TextField label="Notes" defaultValue="Quick watering" fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialog(null)}>Cancel</Button>
          <Button onClick={() => handleQuickAction('water')} variant="contained">
            Log Watering
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={quickActionDialog === 'feed'} onClose={() => setQuickActionDialog(null)}>
        <DialogTitle>Quick Feeding</DialogTitle>
        <DialogContent>
          <TextField label="Nutrient Name" defaultValue="Base Nutrients" fullWidth sx={{ mb: 2 }} />
          <TextField label="Amount (ml)" defaultValue="10" fullWidth sx={{ mb: 2 }} />
          <TextField label="pH Level" defaultValue="6.0" fullWidth sx={{ mb: 2 }} />
          <TextField label="Notes" defaultValue="Quick feeding" fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialog(null)}>Cancel</Button>
          <Button onClick={() => handleQuickAction('feed')} variant="contained">
            Log Feeding
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantDetail;