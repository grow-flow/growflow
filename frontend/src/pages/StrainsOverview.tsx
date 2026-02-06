import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalFlorist as PlantIcon
} from '@mui/icons-material';
import { useStrains, useCreateStrain, useUpdateStrain, useDeleteStrain } from '../hooks/useStrains';
import { Strain, CreateStrainData } from '../types/strain';

const StrainsOverview: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateStrainData>({
    name: '',
    type: 'photoperiod'
  });

  const { data: strains = [], isLoading, error, refetch } = useStrains();
  const createStrainMutation = useCreateStrain();
  const updateStrainMutation = useUpdateStrain();
  const deleteStrainMutation = useDeleteStrain();

  const handleCreate = async () => {
    try {
      await createStrainMutation.mutateAsync(formData);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create strain:', error);
    }
  };

  const handleEdit = (strain: Strain) => {
    setSelectedStrain(strain);
    setFormData({
      name: strain.name,
      type: strain.type
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedStrain) return;

    try {
      await updateStrainMutation.mutateAsync({
        id: selectedStrain.id,
        data: formData
      });
      setEditDialogOpen(false);
      setSelectedStrain(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update strain:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedStrain) return;

    try {
      await deleteStrainMutation.mutateAsync(selectedStrain.id);
      setDeleteDialogOpen(false);
      setSelectedStrain(null);
    } catch (error) {
      console.error('Failed to delete strain:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'photoperiod'
    });
  };

  const getTypeColor = (type: string) => {
    return type === 'autoflower' ? 'warning' : 'primary';
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
        Failed to load strains. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Strain Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Strain
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell width={100} />
              </TableRow>
            </TableHead>
            <TableBody>
              {strains.map((strain) => (
                <TableRow
                  key={strain.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(strain)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlantIcon color="primary" />
                      <Typography variant="subtitle2">{strain.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={strain.type}
                      size="small"
                      color={getTypeColor(strain.type) as 'primary' | 'warning'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {strains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      No strains yet. Create your first strain to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Strain</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'autoflower' | 'photoperiod' })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={createStrainMutation.isPending || !formData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Strain</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'autoflower' | 'photoperiod' })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setDeleteDialogOpen(true);
            }}
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={updateStrainMutation.isPending || !formData.name}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Strain</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedStrain?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteStrainMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrainsOverview;
