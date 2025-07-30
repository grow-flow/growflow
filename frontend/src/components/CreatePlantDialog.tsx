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
  Typography,
  Autocomplete,
  ListItem,
  ListItemText
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useGrowAreas } from '../hooks/useGrowAreas';
import { useStrains, useCreateStrain } from '../hooks/useStrains';
import { usePlants } from '../hooks/usePlants';
import { Plant, PlantPhase } from '../types/models';
import { Strain } from '../types/strain';

interface CreatePlantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (plantData: Partial<Plant>) => Promise<void>;
  growAreaId?: number; // Optional now - can be selected in dialog
}

const CreatePlantDialog: React.FC<CreatePlantDialogProps> = ({
  open,
  onClose,
  onSuccess,
  growAreaId
}) => {
  const { data: growAreas = [] } = useGrowAreas();
  const { data: strains = [] } = useStrains();
  const { data: plants = [] } = usePlants();
  const createStrainMutation = useCreateStrain();
  
  const [formData, setFormData] = useState({
    name: '',
    strain_id: null as number | null,
    grow_area_id: growAreaId || (growAreas[0]?.id || 0),
    medium: 'soil' as 'soil' | 'hydro' | 'coco' | 'dwc'
  });

  const [loading, setLoading] = useState(false);
  const [newStrainName, setNewStrainName] = useState('');

  // Auto-generate plant name based on selected strain abbreviation and count
  const generatePlantName = (strain: Strain): string => {
    const existingCount = plants.filter(p => p.strain === strain.name).length;
    const shortName = strain.abbreviation || strain.name.substring(0, 2).toUpperCase();
    return `${shortName}#${existingCount + 1}`;
  };

  const handleStrainChange = (strain: Strain | null) => {
    if (strain) {
      setFormData({
        ...formData,
        strain_id: strain.id,
        name: generatePlantName(strain)
      });
    } else {
      setFormData({
        ...formData,
        strain_id: null,
        name: ''
      });
    }
  };

  const handleCreateStrain = async (name: string): Promise<Strain | null> => {
    try {
      const newStrain = await createStrainMutation.mutateAsync({
        name,
        abbreviation: name.substring(0, 2).toUpperCase(),
        type: 'hybrid',
        is_autoflower: false,
        flowering_time_min: 56,
        flowering_time_max: 70,
        description: '',
        breeder: '',
        thc_content: 20,
        cbd_content: 1,
        phase_durations: {
          'germination': 7,
          'seedling': 14,
          'vegetation': 42,
          'pre_flower': 10,
          'flowering': 63,
          'flushing': 14,
          'drying': 10,
          'curing': 28
        }
      });
      
      setNewStrainName('');
      return newStrain;
    } catch (error) {
      console.error('Failed to create strain:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    let selectedStrain: Strain | undefined;
    
    // If we have a strain_id, use existing strain
    if (formData.strain_id) {
      selectedStrain = strains.find(s => s.id === formData.strain_id);
    }
    // If we have a newStrainName but no strain_id, create new strain
    else if (newStrainName.trim()) {
      selectedStrain = await handleCreateStrain(newStrainName.trim()) || undefined;
      if (selectedStrain) {
        // Update formData with new strain
        setFormData(prev => ({
          ...prev,
          strain_id: selectedStrain!.id,
          name: generatePlantName(selectedStrain!)
        }));
      }
    }
    
    if (!selectedStrain) return;

    setLoading(true);
    try {
      // Auto-detect light schedule based on strain type
      const lightSchedule = selectedStrain.is_autoflower 
        ? { vegetation: '18/6', flowering: '18/6' }
        : { vegetation: '18/6', flowering: '12/12' };

      await onSuccess({
        name: selectedStrain ? generatePlantName(selectedStrain) : '',
        strain: selectedStrain.name,
        breeder: selectedStrain.breeder,
        grow_area_id: formData.grow_area_id,
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
        grow_area_id: growAreaId || (growAreas[0]?.id || 0),
        medium: 'soil'
      });
      setNewStrainName('');
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
              <Autocomplete
                options={strains}
                getOptionLabel={(strain) => 
                  typeof strain === 'string' ? strain : `${strain.name} ${strain.is_autoflower ? '(Auto)' : '(Photo)'} - ${strain.type}${strain.breeder ? ` by ${strain.breeder}` : ''}`
                }
                value={strains.find(s => s.id === formData.strain_id) || newStrainName || null}
                onChange={(_, strain) => {
                  if (typeof strain === 'string') {
                    // User typed a new strain name
                    setNewStrainName(strain);
                    // Clear existing strain selection
                    setFormData(prev => ({ ...prev, strain_id: null, name: '' }));
                  } else {
                    handleStrainChange(strain);
                    setNewStrainName('');
                  }
                }}
                freeSolo
                onInputChange={(_, value) => setNewStrainName(value || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or Create Strain"
                    required
                    placeholder="Type to search or create new strain..."
                  />
                )}
                renderOption={(props, strain, { inputValue }) => {
                  // Handle string options (from freeSolo)
                  if (typeof strain === 'string') {
                    return null; // Don't render string options in dropdown
                  }
                  
                  return (
                    <div key={strain.id}>
                      <ListItem {...props}>
                        <ListItemText
                          primary={`${strain.name} ${strain.is_autoflower ? '(Auto)' : '(Photo)'}`}
                          secondary={`${strain.type}${strain.breeder ? ` by ${strain.breeder}` : ''}`}
                        />
                      </ListItem>
                    </div>
                  );
                }}
                noOptionsText={
                  newStrainName && newStrainName.trim() ? (
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Will create new strain "{newStrainName}" when plant is saved
                      </Typography>
                    </Box>
                  ) : (
                    "No strains found"
                  )
                }
              />
            </Grid>

            {/* Plant Name - Auto-generated display */}
            {(formData.strain_id || newStrainName.trim()) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plant Name (Auto-generated)"
                  value={formData.name || (newStrainName ? `${newStrainName.substring(0, 2).toUpperCase()}#1` : '')}
                  disabled
                  variant="filled"
                  helperText="Name is automatically generated from strain abbreviation and plant number"
                />
              </Grid>
            )}

            {/* Grow Area Selection */}
            {growAreas.length > 1 && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Grow Area</InputLabel>
                  <Select
                    value={formData.grow_area_id}
                    onChange={(e) => setFormData({ ...formData, grow_area_id: Number(e.target.value) })}
                    label="Grow Area"
                  >
                    {growAreas.map((growArea) => (
                      <MenuItem key={growArea.id} value={growArea.id}>
                        {growArea.name} ({growArea.type})
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

          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (!formData.strain_id && !newStrainName.trim())}
        >
          {loading ? 'Creating...' : 'Create Plant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlantDialog;