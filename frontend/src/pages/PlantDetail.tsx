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
import { usePlant } from '../hooks/usePlants';
import DynamicPlantTimeline from '../components/DynamicPlantTimeline';

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
  const [quickActionDialog, setQuickActionDialog] = useState<'water' | 'feed' | null>(null);

  const handleQuickAction = async (action: 'water' | 'feed') => {
    if (!plant) return;
    
    try {
      // TODO: Implement event creation with new event system
      console.log(`${action} logged`);
      setQuickActionDialog(null);
    } catch (error) {
      console.error(`Failed to log ${action}:`, error);
    }
  };

  const getCurrentPhase = () => {
    if (!plant) return null;
    return plant.phases.find(phase => phase.is_active);
  };

  const getDaysInCurrentPhase = () => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase?.start_date) return 0;
    
    const now = new Date();
    const start = new Date(currentPhase.start_date);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTotalDays = () => {
    if (!plant) return 0;
    const firstPhase = plant.phases.find(p => p.start_date);
    if (!firstPhase?.start_date) return 0;
    
    const now = new Date();
    const start = new Date(firstPhase.start_date);
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
              <Chip label={getCurrentPhase()?.name || 'Unknown'} color="secondary" />
              <Chip label={plant.medium} variant="outlined" />
              {plant.is_mother_plant && <Chip label="Mother Plant" color="success" />}
            </Box>
            <Typography color="textSecondary">
              Day {getDaysInCurrentPhase()} in {getCurrentPhase()?.name || 'Unknown'} • Total: {getTotalDays()} days
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
            <DynamicPlantTimeline plant={plant} />
          </Paper>
        </Grid>

        {/* Care History Tabs */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Events (${plant.events?.length || 0})`} />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {plant.events?.map((event) => (
                  <Card key={event.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2">
                        {new Date(event.timestamp).toLocaleDateString()} - {event.title}
                      </Typography>
                      <Chip label={event.type} size="small" sx={{ mb: 1 }} />
                      {event.description && <Typography variant="body2">{event.description}</Typography>}
                      {event.notes && <Typography variant="body2" color="textSecondary">{event.notes}</Typography>}
                    </CardContent>
                  </Card>
                )) || []}
                {(!plant.events || plant.events.length === 0) && (
                  <Typography color="textSecondary">No events logged yet</Typography>
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