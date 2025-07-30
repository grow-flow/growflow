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
  Chip,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList,
  Edit as EditIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Link, useSearchParams } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { usePlants, useCreatePlant } from '../hooks/usePlants';
import { Plant, PlantPhase } from '../types/models';
import CreatePlantDialog from '../components/CreatePlantDialog';
import PhaseManagementDialog from '../components/PhaseManagementDialog';

const PlantsOverview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  
  // Initialize filters from URL params and auto-open filter panel if strain is set
  const [filters, setFilters] = useState(() => {
    const initialFilters = {
      search: searchParams.get('search') || '',
      phase: searchParams.get('phase') || '',
      growbox: searchParams.get('growbox') || '',
      strain: searchParams.get('strain') || '',
      isActive: searchParams.get('isActive') || 'all'
    };
    return initialFilters;
  });
  
  // Auto-open filter panel if coming from strain page
  React.useEffect(() => {
    if (searchParams.get('strain')) {
      setFilterOpen(true);
    }
  }, [searchParams]);

  const { 
    data: plants = [], 
    isLoading, 
    error,
    refetch 
  } = usePlants();
  
  const createPlantMutation = useCreatePlant();

  // Filter plants based on current filters
  const filteredPlants = plants.filter(plant => {
    if (filters.search && !plant.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !plant.strain.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.phase && plant.current_phase !== filters.phase) return false;
    if (filters.strain && plant.strain !== filters.strain) return false;
    if (filters.isActive === 'active' && !plant.is_active) return false;
    if (filters.isActive === 'inactive' && plant.is_active) return false;
    return true;
  });

  // Get unique values for filter dropdowns
  const uniquePhases = Array.from(new Set(plants.map(p => p.current_phase)));
  const uniqueStrains = Array.from(new Set(plants.map(p => p.strain)));

  const handlePlantCreated = async (plantData: Partial<Plant>) => {
    try {
      await createPlantMutation.mutateAsync(plantData);
      setCreatePlantDialogOpen(false);
    } catch (error) {
      console.error('Failed to create plant:', error);
    }
  };


  const getDaysInPhase = (plant: Plant) => {
    const now = new Date();
    let startDate: Date;

    switch (plant.current_phase) {
      case 'germination':
      case 'seedling':
        startDate = new Date(plant.germination_date);
        break;
      case 'vegetation':
      case 'pre_flower':
        startDate = plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : new Date(plant.germination_date);
        break;
      case 'flowering':
      case 'flushing':
        startDate = plant.flowering_start_date ? new Date(plant.flowering_start_date) : new Date(plant.germination_date);
        break;
      default:
        startDate = new Date(plant.germination_date);
    }

    return differenceInDays(now, startDate);
  };

  const getTotalDays = (plant: Plant) => {
    return differenceInDays(new Date(), new Date(plant.germination_date));
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'germination': return 'success';
      case 'seedling': return 'success';
      case 'vegetation': return 'primary';
      case 'pre_flower': return 'warning';
      case 'flowering': return 'secondary';
      case 'flushing': return 'info';
      case 'harvest': return 'default';
      case 'drying': return 'default';
      case 'curing': return 'default';
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
        Failed to load plants. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Plants Overview</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreatePlantDialogOpen(true)}
          >
            Add Plant
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {filterOpen && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Plant name or strain..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={filters.phase}
                  onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                  label="Phase"
                >
                  <MenuItem value="">All Phases</MenuItem>
                  {uniquePhases.map(phase => (
                    <MenuItem key={phase} value={phase}>{phase}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Strain</InputLabel>
                <Select
                  value={filters.strain}
                  onChange={(e) => setFilters({ ...filters, strain: e.target.value })}
                  label="Strain"
                >
                  <MenuItem value="">All Strains</MenuItem>
                  {uniqueStrains.map(strain => (
                    <MenuItem key={strain} value={strain}>{strain}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="all">All Plants</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ search: '', phase: '', growbox: '', strain: '', isActive: 'all' })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Plants Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plant</TableCell>
                <TableCell>Strain</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Days in Phase</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Medium</TableCell>
                <TableCell>Germination Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlants.map((plant) => (
                <TableRow key={plant.id} hover>
                  <TableCell>
                    <Button
                      component={Link}
                      to={`/plant/${plant.id}`}
                      variant="text"
                      sx={{ textTransform: 'none', p: 0, justifyContent: 'flex-start' }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{plant.name}</Typography>
                        {plant.is_mother_plant && (
                          <Chip label="Mother" size="small" color="success" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </Button>
                  </TableCell>
                  <TableCell>{plant.strain}</TableCell>
                  <TableCell>
                    <Chip
                      label={plant.current_phase}
                      size="small"
                      color={getPhaseColor(plant.current_phase) as any}
                    />
                  </TableCell>
                  <TableCell>{getDaysInPhase(plant)}</TableCell>
                  <TableCell>{getTotalDays(plant)}</TableCell>
                  <TableCell>
                    <Chip label={plant.medium} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {format(new Date(plant.germination_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plant.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={plant.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedPlant(plant);
                        setPhaseDialogOpen(true);
                      }}
                      title="Manage Phase"
                    >
                      <TimelineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      {plants.length === 0 ? 'No plants yet' : 'No plants match your filters'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Plant Dialog */}
      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
      />

      {/* Phase Management Dialog */}
      <PhaseManagementDialog
        open={phaseDialogOpen}
        onClose={() => {
          setPhaseDialogOpen(false);
          setSelectedPlant(null);
        }}
        plant={selectedPlant}
      />
    </Box>
  );
};

export default PlantsOverview;