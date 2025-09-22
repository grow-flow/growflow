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
import { useGrowAreas } from '../hooks/useGrowAreas';
import { useStrains, useCreateStrain } from '../hooks/useStrains';
import { usePlants } from '../hooks/usePlants';
import { Plant } from '../types/models';
import { Strain, StartMethod, composePhaseTemplates } from '../types/strain';

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
    grow_area_id: growAreaId || 0,
    medium: 'soil' as 'soil' | 'hydro' | 'coco' | 'dwc',
    start_method: 'seed' as StartMethod
  });

  const [loading, setLoading] = useState(false);
  const [newStrainName, setNewStrainName] = useState('');

  // Update grow_area_id when growAreas load
  React.useEffect(() => {
    if (!formData.grow_area_id && growAreas.length > 0) {
      setFormData(prev => ({
        ...prev,
        grow_area_id: growAreaId || growAreas[0].id
      }));
    }
  }, [growAreas, growAreaId, formData.grow_area_id]);

  // Auto-generate plant name based on selected strain abbreviation and count
  const generatePlantName = (strain: Strain): string => {
    const existingCount = plants.filter(p => p.strain === strain.name).length;
    const shortName = strain.abbreviation || strain.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
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
        abbreviation: name.split(' ').map(word => word.charAt(0)).join('').toUpperCase(),
        type: 'photoperiod', // Default, wird beim Erstellen überschrieben
        is_autoflower: false,
        flowering_time_min: 56,
        flowering_time_max: 84,
        description: '',
        breeder: '',
        phase_templates: composePhaseTemplates('photoperiod', formData.start_method)
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
      const plantData = {
        name: selectedStrain ? generatePlantName(selectedStrain) : '',
        strain: selectedStrain.name,
        breeder: selectedStrain.breeder,
        grow_area_id: formData.grow_area_id,
        medium: formData.medium,
        pot_size_liters: 20,
        training_methods: [],
        notes: '',
        is_mother_plant: false,
        start_method: formData.start_method,
        plant_type: selectedStrain.type,
        phases: (() => {
          console.log('🔍 CreatePlant Debug:', {
            strainType: selectedStrain.type,
            startMethod: formData.start_method,
            strainPhaseTemplates: selectedStrain.phase_templates
          });
          const composed = composePhaseTemplates(selectedStrain.type, formData.start_method, selectedStrain.phase_templates);
          console.log('✅ Composed phases:', composed.map(p => p.name));
          return composed;
        })().map((template, index) => ({
          id: `phase-${index}`,
          name: template.name,
          duration_min: template.duration_min,
          duration_max: template.duration_max,
          description: template.description,
          is_active: index === 0,
          is_completed: false,
          start_date: index === 0 ? new Date().toISOString() : undefined
        })),
        events: [],
        is_active: true
      };

      console.log('Creating plant with data:', JSON.stringify(plantData, null, 2));
      await onSuccess(plantData);
      
      // Reset form
      setFormData({
        name: '',
        strain_id: null,
        grow_area_id: growAreaId || (growAreas[0]?.id || 0),
        medium: 'soil' as 'soil' | 'hydro' | 'coco' | 'dwc',
        start_method: 'seed' as StartMethod
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
                renderOption={(props, strain) => {
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
                  value={formData.name || (newStrainName ? `${newStrainName.split(' ').map(word => word.charAt(0)).join('').toUpperCase()}#1` : '')}
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

            {/* Start Method */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Start Method</InputLabel>
                <Select
                  value={formData.start_method}
                  onChange={(e) => setFormData({ ...formData, start_method: e.target.value as StartMethod })}
                  label="Start Method"
                >
                  <MenuItem value="seed">Seed</MenuItem>
                  <MenuItem value="clone">Clone</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Growing Medium */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Growing Medium</InputLabel>
                <Select
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value as 'soil' | 'hydro' | 'coco' | 'dwc' })}
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