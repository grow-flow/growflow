import React from 'react';
import { Grid, TextField, InputAdornment, Box, IconButton, Divider, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { PlantEvent } from '../../types/models';

interface WateringFormProps {
  data: PlantEvent['data'];
  onChange: (data: PlantEvent['data']) => void;
}

const WateringForm: React.FC<WateringFormProps> = ({ data = {}, onChange }) => {
  const nutrients = data.nutrients || [];

  const handleChange = (field: string, value: string | number | undefined) => {
    onChange({
      ...data,
      [field]: value === '' ? undefined : value,
    });
  };

  const handleNutrientChange = (index: number, field: string, value: string | number) => {
    const updatedNutrients = [...nutrients];
    updatedNutrients[index] = {
      ...updatedNutrients[index],
      [field]: value,
    };
    
    onChange({
      ...data,
      nutrients: updatedNutrients,
    });
  };

  const addNutrient = () => {
    onChange({
      ...data,
      nutrients: [...nutrients, { name: '', amount_ml: 0 }],
    });
  };

  const removeNutrient = (index: number) => {
    onChange({
      ...data,
      nutrients: nutrients.filter((_, i) => i !== index),
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Water Amount"
          type="number"
          value={data.amount_ml || ''}
          onChange={(e) => handleChange('amount_ml', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">ml</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 50 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="Water Temperature"
          type="number"
          value={data.water_temperature || ''}
          onChange={(e) => handleChange('water_temperature', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">°C</InputAdornment>,
          }}
          inputProps={{ min: 0, max: 50, step: 0.5 }}
        />
      </Grid>

      {/* Nutrients Section */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2">Nutrients</Typography>
          <IconButton size="small" onClick={addNutrient} color="primary">
            <AddIcon />
          </IconButton>
        </Box>
        
        {nutrients.map((nutrient, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  label="Nutrient Name"
                  value={nutrient.name}
                  onChange={(e) => handleNutrientChange(index, 'name', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={8} md={4}>
                <TextField
                  label="Amount"
                  type="number"
                  value={nutrient.amount_ml}
                  onChange={(e) => handleNutrientChange(index, 'amount_ml', Number(e.target.value))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ml</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
              <Grid item xs={4} md={2}>
                <TextField
                  label="NPK Ratio"
                  value={nutrient.npk_ratio || ''}
                  onChange={(e) => handleNutrientChange(index, 'npk_ratio', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="10-10-10"
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <IconButton size="small" onClick={() => removeNutrient(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
            {index < nutrients.length - 1 && <Divider sx={{ mt: 1 }} />}
          </Box>
        ))}
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="pH Level"
          type="number"
          value={data.ph_level || ''}
          onChange={(e) => handleChange('ph_level', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          inputProps={{ min: 0, max: 14, step: 0.1 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="EC"
          type="number"
          value={data.ec_ppm || ''}
          onChange={(e) => handleChange('ec_ppm', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">PPM</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 10 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="Runoff pH"
          type="number"
          value={data.runoff_ph || ''}
          onChange={(e) => handleChange('runoff_ph', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          inputProps={{ min: 0, max: 14, step: 0.1 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="Runoff EC"
          type="number"
          value={data.runoff_ec || ''}
          onChange={(e) => handleChange('runoff_ec', e.target.value ? Number(e.target.value) : undefined)}
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">PPM</InputAdornment>,
          }}
          inputProps={{ min: 0, step: 10 }}
        />
      </Grid>
    </Grid>
  );
};

export default WateringForm;