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
  Box,
  Chip
} from '@mui/material';
import { useGrowboxes } from '../hooks/useGrowboxes';
import { Plant, PlantPhase } from '../types/models';

interface CreatePlantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (plantData: Partial<Plant>) => Promise<void>;
  growboxId?: number; // Optional now - can be selected in dialog
}

const CreatePlantDialog: React.FC<CreatePlantDialogProps> = ({
  open,
  onClose,
  onSuccess,
  growboxId
}) => {
  const { data: growboxes = [] } = useGrowboxes();
  
  const [formData, setFormData] = useState({
    name: '',
    strain: '',
    breeder: '',
    phenotype: '',
    growbox_id: growboxId || (growboxes[0]?.id || 0),
    medium: 'soil' as 'soil' | 'hydro' | 'coco' | 'dwc',
    pot_size_liters: 20,
    light_schedule: {
      vegetation: '18/6',
      flowering: '12/12'
    },
    training_methods: [] as string[],
    notes: '',
    is_mother_plant: false
  });

  const [loading, setLoading] = useState(false);
  const [newTrainingMethod, setNewTrainingMethod] = useState('');

  const trainingOptions = ['LST', 'SCROG', 'Topping', 'FIM', 'Supercropping', 'Defoliation', 'Lollipopping'];

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.strain.trim()) return;

    setLoading(true);
    try {
      await onSuccess({
        ...formData,
        germination_date: new Date(),
        current_phase: PlantPhase.GERMINATION,
        is_active: true
      });
      
      // Reset form only on success
      setFormData({
        name: '',
        strain: '',
        breeder: '',
        phenotype: '',
        growbox_id: growboxId || (growboxes[0]?.id || 0),
        medium: 'soil',
        pot_size_liters: 20,
        light_schedule: { vegetation: '18/6', flowering: '12/12' },
        training_methods: [],
        notes: '',
        is_mother_plant: false
      });
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrainingMethod = () => {
    if (newTrainingMethod && !formData.training_methods.includes(newTrainingMethod)) {
      setFormData({
        ...formData,
        training_methods: [...formData.training_methods, newTrainingMethod]
      });
      setNewTrainingMethod('');
    }
  };

  const removeTrainingMethod = (method: string) => {
    setFormData({
      ...formData,
      training_methods: formData.training_methods.filter(m => m !== method)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Plant</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Plant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="White Widow #1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Strain"
                value={formData.strain}
                onChange={(e) => setFormData({ ...formData, strain: e.target.value })}
                required
                placeholder="White Widow"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Growbox</InputLabel>
                <Select
                  value={formData.growbox_id}
                  onChange={(e) => setFormData({ ...formData, growbox_id: Number(e.target.value) })}
                  label="Growbox"
                >
                  {growboxes.map((growbox) => (
                    <MenuItem key={growbox.id} value={growbox.id}>
                      {growbox.name} ({growbox.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Breeder"
                value={formData.breeder}
                onChange={(e) => setFormData({ ...formData, breeder: e.target.value })}
                placeholder="White Label Seeds"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phenotype"
                value={formData.phenotype}
                onChange={(e) => setFormData({ ...formData, phenotype: e.target.value })}
                placeholder="Indica Dominant"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Growing Medium</InputLabel>
                <Select
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value as any })}
                  label="Growing Medium"
                >
                  <MenuItem value="soil">Soil</MenuItem>
                  <MenuItem value="hydro">Hydroponic</MenuItem>
                  <MenuItem value="coco">Coco Coir</MenuItem>
                  <MenuItem value="dwc">DWC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pot Size (Liters)"
                type="number"
                value={formData.pot_size_liters}
                onChange={(e) => setFormData({ ...formData, pot_size_liters: Number(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12}>
              <DialogTitle sx={{ px: 0 }}>Light Schedule</DialogTitle>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vegetation Schedule"
                value={formData.light_schedule.vegetation}
                onChange={(e) => setFormData({
                  ...formData,
                  light_schedule: { ...formData.light_schedule, vegetation: e.target.value }
                })}
                placeholder="18/6"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Flowering Schedule"
                value={formData.light_schedule.flowering}
                onChange={(e) => setFormData({
                  ...formData,
                  light_schedule: { ...formData.light_schedule, flowering: e.target.value }
                })}
                placeholder="12/12"
              />
            </Grid>

            <Grid item xs={12}>
              <DialogTitle sx={{ px: 0 }}>Training Methods</DialogTitle>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {formData.training_methods.map((method) => (
                  <Chip
                    key={method}
                    label={method}
                    onDelete={() => removeTrainingMethod(method)}
                    color="primary"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Add Method</InputLabel>
                  <Select
                    value={newTrainingMethod}
                    onChange={(e) => setNewTrainingMethod(e.target.value)}
                    label="Add Method"
                  >
                    {trainingOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" onClick={addTrainingMethod}>
                  Add
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this plant..."
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
          disabled={loading || !formData.name.trim() || !formData.strain.trim()}
        >
          {loading ? 'Creating...' : 'Create Plant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlantDialog;