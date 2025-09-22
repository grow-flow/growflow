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
import { Strain, CreateStrainData, getDefaultStrainPhases, composePhaseTemplates } from '../types/strain';

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
    is_autoflower: false,
    flowering_time_min: 56,
    flowering_time_max: 70,
    description: '',
    breeder: '',
    phase_templates: getDefaultStrainPhases('photoperiod')
  });

  const { data: strains = [], isLoading, error, refetch } = useStrains();
  const createStrainMutation = useCreateStrain();
  const updateStrainMutation = useUpdateStrain();
  const deleteStrainMutation = useDeleteStrain();

  const handleCreate = async () => {
    try {
      await createStrainMutation.mutateAsync({
        ...formData,
        phase_templates: formData.phase_templates
      });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create strain:', error);
    }
  };

  const handleEdit = (strain: Strain) => {
    setSelectedStrain(strain);
    const phaseTemplates = strain.phase_templates || getDefaultStrainPhases(strain.type);
    setFormData({
      name: strain.name,
      abbreviation: strain.abbreviation || '',
      type: strain.type,
      is_autoflower: strain.is_autoflower,
      flowering_time_min: strain.flowering_time_min,
      flowering_time_max: strain.flowering_time_max,
      description: strain.description || '',
      breeder: strain.breeder || '',
      phase_templates: phaseTemplates
    });
    const cleanTemplates = createCleanPhaseTemplates(phaseTemplates);
    setPhaseJsonInput(JSON.stringify(cleanTemplates, null, 2));
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
      is_autoflower: false,
      flowering_time_min: 56,
      flowering_time_max: 70,
      description: '',
      breeder: '',
      phase_templates: getDefaultStrainPhases('photoperiod')
    });
    setAdvancedOpen(false);
    setPhaseJsonInput('');
  };

  // Create clean phase templates without any extra fields
  const createCleanPhaseTemplates = (templates: any[]) => {
    return templates.map(template => ({
      name: template.name,
      duration_min: template.duration_min,
      duration_max: template.duration_max,
      description: template.description
    }));
  };

  const exportPhaseTemplates = () => {
    const cleanTemplates = createCleanPhaseTemplates(formData.phase_templates || []);
    const json = JSON.stringify(cleanTemplates, null, 2);
    navigator.clipboard.writeText(json);
    setPhaseJsonInput(json);
  };

  const downloadPhaseTemplates = () => {
    const cleanTemplates = createCleanPhaseTemplates(formData.phase_templates || []);
    const json = JSON.stringify(cleanTemplates, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.name || 'strain'}-phases.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPhaseTemplates = () => {
    try {
      const parsed = JSON.parse(phaseJsonInput);
      if (Array.isArray(parsed) && parsed.every(p => p.name && typeof p.duration_min === 'number' && typeof p.duration_max === 'number')) {
        // Use the clean templates directly (no IDs needed for strain templates)
        setFormData({ ...formData, phase_templates: parsed });
        setPhaseJsonInput('');
      } else {
        alert('Ungültiges JSON Format. Erwartet wird ein Array von Phase Templates mit name, duration_min, duration_max.');
      }
    } catch (error) {
      alert('Ungültiges JSON Format. Bitte überprüfen Sie die Syntax.');
    }
  };

  const loadDefaultPhases = () => {
    const defaultPhases = getDefaultStrainPhases(formData.type);
    setFormData({ ...formData, phase_templates: defaultPhases });
    const cleanTemplates = createCleanPhaseTemplates(defaultPhases);
    setPhaseJsonInput(JSON.stringify(cleanTemplates, null, 2));
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
                <TableCell>Abbrev.</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Flowering Time</TableCell>
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
                    {strain.abbreviation ? (
                      <Chip 
                        label={strain.abbreviation} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value as any,
                    is_autoflower: e.target.value === 'autoflower'
                  })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
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
                Phase Templates Konfiguration
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Collapse in={advancedOpen}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Strain-spezifische Phasen
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Nur strain-spezifische Phasen (Vegetation, Flowering) werden hier konfiguriert. 
                    Start-Phasen und End-Phasen werden automatisch hinzugefügt.
                  </Typography>
                  
                  {/* Current Phase Templates Display */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Aktuelle Phasen: {formData.phase_templates?.length || 0} Phasen
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.phase_templates?.map((phase, index) => (
                        <Chip
                          key={index}
                          label={`${phase.name} (${phase.duration_min}-${phase.duration_max}d)`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Export Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={exportPhaseTemplates}
                      variant="outlined"
                    >
                      In Zwischenablage kopieren
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadPhaseTemplates}
                      variant="outlined"
                    >
                      Als JSON downloaden
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={loadDefaultPhases}
                      variant="outlined"
                    >
                      Standard laden
                    </Button>
                  </Box>

                  {/* Import Area */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      JSON Import
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={phaseJsonInput}
                      onChange={(e) => setPhaseJsonInput(e.target.value)}
                      placeholder="Phase Templates JSON hier einfügen..."
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={importPhaseTemplates}
                        variant="contained"
                        disabled={!phaseJsonInput.trim()}
                      >
                        JSON importieren
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPhaseJsonInput('')}
                        disabled={!phaseJsonInput.trim()}
                      >
                        Leeren
                      </Button>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Tipp: Sie können Phase Templates zwischen Strains kopieren oder als Backup exportieren.
                  </Typography>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value as any,
                    is_autoflower: e.target.value === 'autoflower'
                  })}
                  label="Type"
                >
                  <MenuItem value="photoperiod">Photoperiod</MenuItem>
                  <MenuItem value="autoflower">Autoflower</MenuItem>
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
                Phase Templates Konfiguration
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Collapse in={advancedOpen}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Strain-spezifische Phasen
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Nur strain-spezifische Phasen (Vegetation, Flowering) werden hier konfiguriert. 
                    Start-Phasen und End-Phasen werden automatisch hinzugefügt.
                  </Typography>
                  
                  {/* Current Phase Templates Display */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Aktuelle Phasen: {formData.phase_templates?.length || 0} Phasen
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {formData.phase_templates?.map((phase, index) => (
                        <Chip
                          key={index}
                          label={`${phase.name} (${phase.duration_min}-${phase.duration_max}d)`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Export Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={exportPhaseTemplates}
                      variant="outlined"
                    >
                      In Zwischenablage kopieren
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={downloadPhaseTemplates}
                      variant="outlined"
                    >
                      Als JSON downloaden
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={loadDefaultPhases}
                      variant="outlined"
                    >
                      Standard laden
                    </Button>
                  </Box>

                  {/* Import Area */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      JSON Import
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={phaseJsonInput}
                      onChange={(e) => setPhaseJsonInput(e.target.value)}
                      placeholder="Phase Templates JSON hier einfügen..."
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={importPhaseTemplates}
                        variant="contained"
                        disabled={!phaseJsonInput.trim()}
                      >
                        JSON importieren
                      </Button>
                      <Button
                        size="small"
                        onClick={() => setPhaseJsonInput('')}
                        disabled={!phaseJsonInput.trim()}
                      >
                        Leeren
                      </Button>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Tipp: Sie können Phase Templates zwischen Strains kopieren oder als Backup exportieren.
                  </Typography>
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