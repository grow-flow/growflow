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
import { GrowArea } from '../types/models';

interface CreateGrowAreaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (growAreaData: Partial<GrowArea>) => Promise<void>;
}

const CreateGrowAreaDialog: React.FC<CreateGrowAreaDialogProps> = ({
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
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onSuccess(formData);
      
      // Reset form only on success
      setFormData({
        name: '',
        type: 'indoor',
        dimensions: { length: 120, width: 120, height: 200 }
      });
    } catch (error) {
      console.error('Failed to create grow area:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Grow Area</DialogTitle>
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

export default CreateGrowAreaDialog;