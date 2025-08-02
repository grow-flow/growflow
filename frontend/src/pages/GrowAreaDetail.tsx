import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Thermostat, 
  Opacity, 
  Lightbulb, 
  Air, 
  Add as AddIcon 
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGrowArea } from '../hooks/useGrowAreas';
import { useCreatePlant } from '../hooks/usePlants';
import { GrowArea, Plant } from '../types/models';
import CreatePlantDialog from '../components/CreatePlantDialog';
import SimplePlantList from '../components/SimplePlantList';

const GrowAreaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  const [envData] = useState({
    temperature: 24.2,
    humidity: 58,
    vpd: 1.1,
    targetVpd: 1.0
  });

  // Mock environment history data
  const [envHistory] = useState([
    { time: '00:00', temperature: 23.5, humidity: 60, vpd: 1.0 },
    { time: '04:00', temperature: 22.8, humidity: 62, vpd: 0.9 },
    { time: '08:00', temperature: 24.1, humidity: 58, vpd: 1.1 },
    { time: '12:00', temperature: 25.2, humidity: 55, vpd: 1.3 },
    { time: '16:00', temperature: 24.8, humidity: 57, vpd: 1.2 },
    { time: '20:00', temperature: 24.2, humidity: 58, vpd: 1.1 }
  ]);

  const growAreaId = id ? parseInt(id) : 0;
  const { 
    data: growArea, 
    isLoading, 
    error,
    refetch 
  } = useGrowArea(growAreaId);
  
  const createPlantMutation = useCreatePlant();
  
  const plants = growArea?.plants || [];

  const handleEquipmentToggle = async (equipment: string, isOn: boolean) => {
    // Implementation für HA API calls
    console.log(`Toggle ${equipment}: ${isOn}`);
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
        Failed to load grow area. Please try again.
      </Alert>
    );
  }

  if (!growArea) return <Typography>Grow area not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{growArea.name}</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreatePlantDialogOpen(true)}
        >
          Add Plant
        </Button>
      </Box>

      {/* Growbox Visualization */}
      {/* Simplified plant display */}
      <SimplePlantList plants={plants} />

      <Grid container spacing={3}>
        {/* Environment Panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Environment Monitoring</Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Thermostat color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5">{envData.temperature}°C</Typography>
                  <Typography variant="caption">Temperature</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Opacity color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5">{envData.humidity}%</Typography>
                  <Typography variant="caption">Humidity</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">{envData.vpd}</Typography>
                  <Typography variant="caption">VPD (kPa)</Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="secondary">{envData.targetVpd}</Typography>
                  <Typography variant="caption">Target VPD</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={envHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature" />
                  <Line type="monotone" dataKey="humidity" stroke="#00bcd4" name="Humidity" />
                  <Line type="monotone" dataKey="vpd" stroke="#4caf50" name="VPD" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Equipment Control */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Equipment Control</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {growArea.equipment.lights.map((light, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lightbulb />
                    <Typography>Light {index + 1}</Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        onChange={(e) => handleEquipmentToggle(light, e.target.checked)}
                      />
                    }
                    label=""
                  />
                </Box>
              ))}
              
              {growArea.equipment.fans.map((fan, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Air />
                    <Typography>Fan {index + 1}</Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        onChange={(e) => handleEquipmentToggle(fan, e.target.checked)}
                      />
                    }
                    label=""
                  />
                </Box>
              ))}

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={growArea.automation_enabled}
                      onChange={(e) => console.log('Automation:', e.target.checked)}
                    />
                  }
                  label="VPD Automation"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Plants Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Plants in this Growbox</Typography>
            
            {plants.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Strain</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Days in Phase</TableCell>
                      <TableCell>Last Watered</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plants.map((plant) => (
                      <TableRow key={plant.id}>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/plant/${plant.id}`}
                            variant="text"
                            sx={{ textTransform: 'none', p: 0 }}
                          >
                            {plant.name}
                          </Button>
                        </TableCell>
                        <TableCell>{plant.strain}</TableCell>
                        <TableCell>{plant.phases.find(p => p.is_active)?.name || 'Unknown'}</TableCell>
                        <TableCell>12 days</TableCell>
                        <TableCell>2 days ago</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                            Water
                          </Button>
                          <Button size="small" variant="outlined">
                            Feed
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary" gutterBottom>
                  No plants in this grow area yet
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => setCreatePlantDialogOpen(true)}
                >
                  Add First Plant
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Plant Data Columns */}
      {/* Plant data now shown in SimplePlantList above */}

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
        growAreaId={growArea.id}
      />
    </Box>
  );
};

export default GrowAreaDetail;