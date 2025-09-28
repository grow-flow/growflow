import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PlantEvent } from '../../types/models';

interface TrainingFormProps {
  data: PlantEvent['data'];
  onChange: (data: PlantEvent['data']) => void;
}

const TRAINING_METHODS = [
  'Low Stress Training (LST)',
  'High Stress Training (HST)',
  'Topping',
  'FIMing',
  'Defoliation',
  'Lollipopping',
  'SCROG (Screen of Green)',
  'SOG (Sea of Green)',
  'Supercropping',
  'Pruning',
  'Other'
];

const TrainingForm: React.FC<TrainingFormProps> = ({ data = {}, onChange }) => {
  const handleChange = (field: string, value: string | undefined) => {
    onChange({
      ...data,
      [field]: value === '' ? undefined : value,
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Training Method</InputLabel>
          <Select
            value={data.training_method || ''}
            onChange={(e) => handleChange('training_method', e.target.value)}
          >
            {TRAINING_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {data.training_method === 'Other' && (
        <Grid item xs={12}>
          <TextField
            label="Custom Training Method"
            value={data.training_method || ''}
            onChange={(e) => handleChange('training_method', e.target.value)}
            fullWidth
          />
        </Grid>
      )}
    </Grid>
  );
};

export default TrainingForm;