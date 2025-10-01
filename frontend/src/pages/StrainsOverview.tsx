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
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStrains, useCreateStrain, useUpdateStrain, useDeleteStrain } from '../hooks/useStrains';
import { Strain, CreateStrainData } from '../types/strain';

const StrainsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [phaseJsonInput, setPhaseJsonInput] = useState('');
  
  const [formData, setFormData] = useState<CreateStrainData>({
    name: '',
    abbreviation: '',
    type: 'photoperiod',
    description: '',
    breeder: ''
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
      abbreviation: strain.abbreviation || '',
      type: strain.type,
      description: strain.description || '',
      breeder: strain.breeder || ''
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
      abbreviation: '',
      type: 'photoperiod',
        description: '',
      breeder: ''
    });
    setAdvancedOpen(false);
    setPhaseJsonInput('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photoperiod': return 'primary';
      case 'autoflower': return 'warning';
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
                <TableCell>Breeder</TableCell>
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
                  <TableCell>{strain.breeder || 'Unknown'}</TableCell>
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

      {/* Create Strain Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Strain</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.slice(0, 4).toUpperCase() })}
                placeholder="WW, GG, AK..."
                inputProps={{ maxLength: 4 }}
                helperText="Max 4 characters"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as any
                  })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
                </Select>
              </FormControl>
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
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Strain Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.slice(0, 4).toUpperCase() })}
                placeholder="WW, GG, AK..."
                inputProps={{ maxLength: 4 }}
                helperText="Max 4 characters"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as any
                  })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
                </Select>
              </FormControl>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedStrain(selectedStrain);
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