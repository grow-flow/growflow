import React from 'react';
import { Grid, TextField, InputAdornment } from '@mui/material';
import { PlantEvent } from '../../types/models';

interface WateringFormProps {
  data: PlantEvent['data'];
  onChange: (data: PlantEvent['data']) => void;
}

const WateringForm: React.FC<WateringFormProps> = ({ data = {}, onChange }) => {
  const handleChange = (field: string, value: string | number | undefined) => {
    onChange({ ...data, [field]: value === '' ? undefined : value });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <TextField
          label="Water Amount"
          type="number"
          value={data.amount_ml || ''}
          onChange={(e) => handleChange('amount_ml', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{ endAdornment: <InputAdornment position="end">ml</InputAdornment> }}
          inputProps={{ min: 0, step: 50 }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label="pH Level"
          type="number"
          value={data.ph_level || ''}
          onChange={(e) => handleChange('ph_level', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          inputProps={{ min: 0, max: 14, step: 0.1 }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          label="EC"
          type="number"
          value={data.ec_ppm || ''}
          onChange={(e) => handleChange('ec_ppm', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{ endAdornment: <InputAdornment position="end">PPM</InputAdornment> }}
          inputProps={{ min: 0, step: 10 }}
        />
      </Grid>
    </Grid>
  );
};

export default WateringForm;
