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
  Typography
} from '@mui/material';
import { useGrowboxes } from '../hooks/useGrowboxes';
import { useStrains } from '../hooks/useStrains';
import { usePlants } from '../hooks/usePlants';
import { Plant, PlantPhase } from '../types/models';
import { Strain } from '../types/strain';

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
  const { data: strains = [] } = useStrains();
  const { data: plants = [] } = usePlants();
  
  const [formData, setFormData] = useState({
    name: '',
    strain_id: null as number | null,
    growbox_id: growboxId || (growboxes[0]?.id || 0),
    medium: 'soil' as 'soil' | 'hydro' | 'coco' | 'dwc'
  });

  const [loading, setLoading] = useState(false);

  // Auto-generate plant name based on selected strain
  const generatePlantName = (strain: Strain): string => {
    const existingCount = plants.filter(p => p.strain === strain.name).length;
    return `${strain.name} #${existingCount + 1}`;
  };

  const handleStrainChange = (strainId: number) => {
    const selectedStrain = strains.find(s => s.id === strainId);
    if (selectedStrain) {
      setFormData({
        ...formData,
        strain_id: strainId,
        name: generatePlantName(selectedStrain)
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.strain_id) return;

    const selectedStrain = strains.find(s => s.id === formData.strain_id);
    if (!selectedStrain) return;

    setLoading(true);
    try {
      // Auto-detect light schedule based on strain type
      const lightSchedule = selectedStrain.is_autoflower 
        ? { vegetation: '18/6', flowering: '18/6' }
        : { vegetation: '18/6', flowering: '12/12' };

      await onSuccess({
        name: formData.name,
        strain: selectedStrain.name,
        breeder: selectedStrain.breeder,
        growbox_id: formData.growbox_id,
        medium: formData.medium,
        pot_size_liters: 20, // Default pot size
        light_schedule: lightSchedule,
        training_methods: [], // Empty initially - added via events
        notes: '',
        is_mother_plant: false,
        germination_date: new Date(),
        current_phase: PlantPhase.GERMINATION,
        is_active: true
      });
      
      // Reset form
      setFormData({
        name: '',
        strain_id: null,
        growbox_id: growboxId || (growboxes[0]?.id || 0),
        medium: 'soil'
      });
    } catch (error) {
      console.error('Failed to create plant:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Plant</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            {/* Strain Selection - FIRST and most important */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Strain</InputLabel>
                <Select
                  value={formData.strain_id || ''}
                  onChange={(e) => handleStrainChange(Number(e.target.value))}
                  label="Select Strain"
                >
                  {strains.map((strain) => (
                    <MenuItem key={strain.id} value={strain.id}>
                      {strain.name} {strain.is_autoflower ? '(Auto)' : '(Photo)'} - {strain.type}
                      {strain.breeder && ` by ${strain.breeder}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Plant Name - Auto-filled but editable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Will be auto-filled when strain is selected"
                disabled={!formData.strain_id}
              />
            </Grid>

            {/* Growbox Selection */}
            {growboxes.length > 1 && (
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
            )}

            {/* Growing Medium */}
            <Grid item xs={12}>
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
                  <MenuItem value="dwc">DWC (Deep Water Culture)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Info about what gets set automatically */}
            {formData.strain_id && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="info.dark">
                    ℹ️ Light schedule, pot size, and training methods will be set automatically based on the strain type. 
                    You can add training methods and observations later through the plant timeline.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim() || !formData.strain_id}
        >
          {loading ? 'Creating...' : 'Create Plant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlantDialog;