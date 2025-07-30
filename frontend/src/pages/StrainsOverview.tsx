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
  IconButton,
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
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Collapse,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalFlorist as PlantIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStrains, useCreateStrain, useUpdateStrain, useDeleteStrain } from '../hooks/useStrains';
import { Strain, CreateStrainData, DEFAULT_PHASE_DURATIONS } from '../types/strain';
import { PlantPhase } from '../types/models';

const StrainsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateStrainData & { phase_durations?: { [key: string]: number } }>({
    name: '',
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

  const { data: strains = [], isLoading, error, refetch } = useStrains();
  const createStrainMutation = useCreateStrain();
  const updateStrainMutation = useUpdateStrain();
  const deleteStrainMutation = useDeleteStrain();

  const handleCreate = async () => {
    try {
      await createStrainMutation.mutateAsync({
        ...formData,
        phase_durations: formData.phase_durations
      });
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
      type: strain.type,
      is_autoflower: strain.is_autoflower,
      flowering_time_min: strain.flowering_time_min,
      flowering_time_max: strain.flowering_time_max,
      description: strain.description || '',
      breeder: strain.breeder || '',
      thc_content: strain.thc_content || 20,
      cbd_content: strain.cbd_content || 1,
      phase_durations: strain.phase_durations || {
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
    setAdvancedOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'indica': return 'primary';
      case 'sativa': return 'secondary';
      case 'hybrid': return 'success';
      case 'autoflowering': return 'warning';
      default: return 'default';
    }
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
      {/* Header */}
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

      {/* Strains Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Flowering Time</TableCell>
                <TableCell>THC/CBD</TableCell>
                <TableCell>Breeder</TableCell>
                <TableCell>Auto</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {strains.map((strain) => (
                <TableRow 
                  key={strain.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/plants?strain=${encodeURIComponent(strain.name)}`)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlantIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle2">{strain.name}</Typography>
                        {strain.description && (
                          <Typography variant="caption" color="textSecondary">
                            {strain.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={strain.type}
                      size="small"
                      color={getTypeColor(strain.type) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    {strain.flowering_time_min}-{strain.flowering_time_max} days
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        THC: {strain.thc_content || 'N/A'}%
                      </Typography>
                      <Typography variant="body2">
                        CBD: {strain.cbd_content || 'N/A'}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{strain.breeder || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip
                      label={strain.is_autoflower ? 'Auto' : 'Photo'}
                      size="small"
                      color={strain.is_autoflower ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(strain);
                      }}
                      title="Edit strain"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStrain(strain);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete strain"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {strains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
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

      {/* Create Strain Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Strain</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value as any,
                    is_autoflower: e.target.value === 'autoflowering'
                  })}
                  label="Type"
                >
                  <MenuItem value="indica">Indica</MenuItem>
                  <MenuItem value="sativa">Sativa</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                  <MenuItem value="autoflowering">Autoflowering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Flowering Time (days)"
                type="number"
                value={formData.flowering_time_min}
                onChange={(e) => setFormData({ ...formData, flowering_time_min: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Flowering Time (days)"
                type="number"
                value={formData.flowering_time_max}
                onChange={(e) => setFormData({ ...formData, flowering_time_max: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="THC Content (%)"
                type="number"
                value={formData.thc_content}
                onChange={(e) => setFormData({ ...formData, thc_content: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CBD Content (%)"
                type="number"
                value={formData.cbd_content}
                onChange={(e) => setFormData({ ...formData, cbd_content: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Breeder"
                value={formData.breeder}
                onChange={(e) => setFormData({ ...formData, breeder: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_autoflower}
                    onChange={(e) => setFormData({ ...formData, is_autoflower: e.target.checked })}
                  />
                }
                label="Autoflowering"
              />
            </Grid>
            
            {/* Advanced Phase Duration Settings */}
            <Grid item xs={12}>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                endIcon={<ExpandMoreIcon sx={{ transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                onClick={() => setAdvancedOpen(!advancedOpen)}
                variant="outlined"
                fullWidth
              >
                Advanced Phase Durations
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Collapse in={advancedOpen}>
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phase Duration Settings (days)
                    </Typography>
                  </Divider>
                  <Grid container spacing={2}>
                    {formData.phase_durations && Object.entries(formData.phase_durations).map(([phase, duration]) => (
                      <Grid item xs={6} md={3} key={phase}>
                        <TextField
                          fullWidth
                          size="small"
                          label={phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ')}
                          type="number"
                          value={duration}
                          onChange={(e) => setFormData({
                            ...formData,
                            phase_durations: {
                              ...formData.phase_durations!,
                              [phase]: parseInt(e.target.value) || 0
                            }
                          })}
                          inputProps={{ min: 1, max: 365 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
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
            Create Strain
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Strain Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Strain: {selectedStrain?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value as any,
                    is_autoflower: e.target.value === 'autoflowering'
                  })}
                  label="Type"
                >
                  <MenuItem value="indica">Indica</MenuItem>
                  <MenuItem value="sativa">Sativa</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                  <MenuItem value="autoflowering">Autoflowering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Flowering Time (days)"
                type="number"
                value={formData.flowering_time_min}
                onChange={(e) => setFormData({ ...formData, flowering_time_min: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Flowering Time (days)"
                type="number"
                value={formData.flowering_time_max}
                onChange={(e) => setFormData({ ...formData, flowering_time_max: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="THC Content (%)"
                type="number"
                value={formData.thc_content}
                onChange={(e) => setFormData({ ...formData, thc_content: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CBD Content (%)"
                type="number"
                value={formData.cbd_content}
                onChange={(e) => setFormData({ ...formData, cbd_content: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Breeder"
                value={formData.breeder}
                onChange={(e) => setFormData({ ...formData, breeder: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_autoflower}
                    onChange={(e) => setFormData({ ...formData, is_autoflower: e.target.checked })}
                  />
                }
                label="Autoflowering"
              />
            </Grid>
            
            {/* Advanced Phase Duration Settings */}
            <Grid item xs={12}>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                endIcon={<ExpandMoreIcon sx={{ transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                onClick={() => setAdvancedOpen(!advancedOpen)}
                variant="outlined"
                fullWidth
              >
                Advanced Phase Durations
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Collapse in={advancedOpen}>
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phase Duration Settings (days)
                    </Typography>
                  </Divider>
                  <Grid container spacing={2}>
                    {formData.phase_durations && Object.entries(formData.phase_durations).map(([phase, duration]) => (
                      <Grid item xs={6} md={3} key={phase}>
                        <TextField
                          fullWidth
                          size="small"
                          label={phase.charAt(0).toUpperCase() + phase.slice(1).replace('_', ' ')}
                          type="number"
                          value={duration}
                          onChange={(e) => setFormData({
                            ...formData,
                            phase_durations: {
                              ...formData.phase_durations!,
                              [phase]: parseInt(e.target.value) || 0
                            }
                          })}
                          inputProps={{ min: 1, max: 365 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained"
            disabled={updateStrainMutation.isPending || !formData.name}
          >
            Update Strain
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Strain</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the strain "{selectedStrain?.name}"? 
            This action cannot be undone.
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