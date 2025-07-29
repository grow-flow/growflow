import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { apiService } from '../services/api';
import { Growbox } from '../types/models';

interface CreateGrowboxDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (growbox: Growbox) => void;
}

const CreateGrowboxDialog: React.FC<CreateGrowboxDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'indoor' as 'indoor' | 'outdoor',
    dimensions: {
      length: 120,
      width: 120,
      height: 200
    },
    equipment: {
      lights: [''],
      fans: [''],
      humidifier: '',
      dehumidifier: '',
      heater: ''
    },
    sensors: {
      temperature: '',
      humidity: '',
      co2: '',
      light_intensity: ''
    },
    target_vpd_by_phase: {
      germination: 0.6,
      seedling: 0.8,
      vegetation: 1.0,
      flowering: 1.2
    }
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const growbox = await apiService.createGrowbox({
        ...formData,
        automation_enabled: false
      });
      onSuccess(growbox);
      onClose();
      setFormData({
        name: '',
        type: 'indoor',
        dimensions: { length: 120, width: 120, height: 200 },
        equipment: { lights: [''], fans: [''], humidifier: '', dehumidifier: '', heater: '' },
        sensors: { temperature: '', humidity: '', co2: '', light_intensity: '' },
        target_vpd_by_phase: { germination: 0.6, seedling: 0.8, vegetation: 1.0, flowering: 1.2 }
      });
    } catch (error) {
      console.error('Failed to create growbox:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Growbox</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'indoor' | 'outdoor' })}
                  label="Type"
                >
                  <MenuItem value="indoor">Indoor</MenuItem>
                  <MenuItem value="outdoor">Outdoor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <DialogTitle sx={{ px: 0 }}>Dimensions (cm)</DialogTitle>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Length"
                type="number"
                value={formData.dimensions.length}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, length: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Width"
                type="number"
                value={formData.dimensions.width}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, width: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Height"
                type="number"
                value={formData.dimensions.height}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, height: Number(e.target.value) }
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <DialogTitle sx={{ px: 0 }}>Sensors (HA Entity IDs)</DialogTitle>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Temperature Sensor"
                value={formData.sensors.temperature}
                onChange={(e) => setFormData({
                  ...formData,
                  sensors: { ...formData.sensors, temperature: e.target.value }
                })}
                placeholder="sensor.tent_temperature"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Humidity Sensor"
                value={formData.sensors.humidity}
                onChange={(e) => setFormData({
                  ...formData,
                  sensors: { ...formData.sensors, humidity: e.target.value }
                })}
                placeholder="sensor.tent_humidity"
              />
            </Grid>

            <Grid item xs={12}>
              <DialogTitle sx={{ px: 0 }}>Equipment (HA Entity IDs)</DialogTitle>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Light Entity"
                value={formData.equipment.lights[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: { ...formData.equipment, lights: [e.target.value] }
                })}
                placeholder="light.grow_tent"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fan Entity"
                value={formData.equipment.fans[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  equipment: { ...formData.equipment, fans: [e.target.value] }
                })}
                placeholder="fan.exhaust_fan"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGrowboxDialog;