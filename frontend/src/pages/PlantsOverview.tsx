import React, { useState } from "react";
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
  Alert,
  Checkbox,
  Toolbar,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList,
  Delete as DeleteIcon,
  Visibility as DeactivateIcon,
  VisibilityOff as ActivateIcon,
} from "@mui/icons-material";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import {
  usePlants,
  useCreatePlant,
  useDeletePlant,
  useUpdatePlant,
} from "../hooks/usePlants";
import { Plant } from "../types/models";
import CreatePlantDialog from "../components/CreatePlantDialog";

const PlantsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<
    "delete" | "deactivate" | "activate" | null
  >(null);

  // Initialize filters from URL params and auto-open filter panel if strain is set
  const [filters, setFilters] = useState(() => {
    const initialFilters = {
      search: searchParams.get("search") || "",
      phase: searchParams.get("phase") || "",
      growArea: searchParams.get("growArea") || "",
      strain: searchParams.get("strain") || "",
      isActive: searchParams.get("isActive") || "all",
    };
    return initialFilters;
  });

  // Auto-open filter panel if coming from strain page
  React.useEffect(() => {
    if (searchParams.get("strain")) {
      setFilterOpen(true);
    }
  }, [searchParams]);

  const { data: plants = [], isLoading, error, refetch } = usePlants();

  const createPlantMutation = useCreatePlant();
  const deletePlantMutation = useDeletePlant();
  const updatePlantMutation = useUpdatePlant();

  // Filter plants based on current filters
  const filteredPlants = plants.filter((plant) => {
    if (
      filters.search &&
      !plant.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !plant.strain.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.phase) {
      let lastStartedIndex = -1;
      for (let i = 0; i < plant.phases.length; i++) {
        if (plant.phases[i].start_date) {
          lastStartedIndex = i;
        }
      }
      const currentPhase =
        lastStartedIndex >= 0 ? plant.phases[lastStartedIndex] : null;
      if (currentPhase?.name !== filters.phase) return false;
    }
    if (filters.strain && plant.strain !== filters.strain) return false;
    if (filters.isActive === "active" && !plant.is_active) return false;
    if (filters.isActive === "inactive" && plant.is_active) return false;
    return true;
  });

  // Get unique values for filter dropdowns
  const uniquePhases = Array.from(
    new Set(
      plants
        .map((p) => {
          let lastStartedIndex = -1;
          for (let i = 0; i < p.phases.length; i++) {
            if (p.phases[i].start_date) {
              lastStartedIndex = i;
            }
          }
          return lastStartedIndex >= 0 ? p.phases[lastStartedIndex].name : null;
        })
        .filter((name): name is string => Boolean(name))
    )
  );
  const uniqueStrains = Array.from(new Set(plants.map((p) => p.strain)));

  const handlePlantCreated = async (plantData: Partial<Plant>) => {
    try {
      await createPlantMutation.mutateAsync(plantData);
      setCreatePlantDialogOpen(false);
    } catch (error) {
      console.error("Failed to create plant:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlantIds(filteredPlants.map((p) => p.id));
    } else {
      setSelectedPlantIds([]);
    }
  };

  const handleSelectPlant = (plantId: number, checked: boolean) => {
    if (checked) {
      setSelectedPlantIds((prev) => [...prev, plantId]);
    } else {
      setSelectedPlantIds((prev) => prev.filter((id) => id !== plantId));
    }
  };

  const handleBulkAction = (action: "delete" | "deactivate" | "activate") => {
    setBulkAction(action);
    if (action === "delete") {
      setDeleteDialogOpen(true);
    } else {
      setDeactivateDialogOpen(true);
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedPlantIds.length === 0) return;

    try {
      if (bulkAction === "delete") {
        // Delete all selected plants
        await Promise.all(
          selectedPlantIds.map((id) => deletePlantMutation.mutateAsync(id))
        );
      } else {
        // Update is_active status for selected plants
        const isActive = bulkAction === "activate";
        await Promise.all(
          selectedPlantIds.map((id) =>
            updatePlantMutation.mutateAsync({
              id,
              data: { is_active: isActive },
            })
          )
        );
      }

      setSelectedPlantIds([]);
      setDeleteDialogOpen(false);
      setDeactivateDialogOpen(false);
      setBulkAction(null);
    } catch (error) {
      console.error("Failed to execute bulk action:", error);
    }
  };

  const getDaysInPhase = (plant: Plant) => {
    let lastStartedIndex = -1;
    for (let i = 0; i < plant.phases.length; i++) {
      if (plant.phases[i].start_date) {
        lastStartedIndex = i;
      }
    }
    const currentPhase =
      lastStartedIndex >= 0 ? plant.phases[lastStartedIndex] : null;
    if (!currentPhase?.start_date) return 0;

    return differenceInDays(new Date(), new Date(currentPhase.start_date));
  };

  const getTotalDays = (plant: Plant) => {
    const firstPhase = plant.phases.find((p) => p.start_date);
    if (!firstPhase?.start_date) return 0;

    return differenceInDays(new Date(), new Date(firstPhase.start_date));
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "germination":
        return "success";
      case "seedling":
        return "success";
      case "vegetation":
        return "primary";
      case "pre_flower":
        return "warning";
      case "flowering":
        return "secondary";
      case "flushing":
        return "info";
      case "harvest":
        return "default";
      case "drying":
        return "default";
      case "curing":
        return "default";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Plants Overview</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
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
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Plant name or strain..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={filters.phase}
                  onChange={(e) =>
                    setFilters({ ...filters, phase: e.target.value })
                  }
                  label="Phase"
                >
                  <MenuItem value="">All Phases</MenuItem>
                  {uniquePhases.map((phase) => (
                    <MenuItem key={phase} value={phase}>
                      {phase}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Strain</InputLabel>
                <Select
                  value={filters.strain}
                  onChange={(e) =>
                    setFilters({ ...filters, strain: e.target.value })
                  }
                  label="Strain"
                >
                  <MenuItem value="">All Strains</MenuItem>
                  {uniqueStrains.map((strain) => (
                    <MenuItem key={strain} value={strain}>
                      {strain}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isActive}
                  onChange={(e) =>
                    setFilters({ ...filters, isActive: e.target.value })
                  }
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
                onClick={() =>
                  setFilters({
                    search: "",
                    phase: "",
                    growArea: "",
                    strain: "",
                    isActive: "all",
                  })
                }
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedPlantIds.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Toolbar>
            <Typography sx={{ flex: 1 }} variant="h6">
              {selectedPlantIds.length} Pflanzen ausgewählt
            </Typography>
            <Button
              startIcon={<DeactivateIcon />}
              onClick={() => handleBulkAction("deactivate")}
              sx={{ mr: 1 }}
            >
              Deaktivieren
            </Button>
            <Button
              startIcon={<ActivateIcon />}
              onClick={() => handleBulkAction("activate")}
              sx={{ mr: 1 }}
            >
              Aktivieren
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => handleBulkAction("delete")}
              color="error"
            >
              Löschen
            </Button>
          </Toolbar>
        </Paper>
      )}

      {/* Plants Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedPlantIds.length > 0 &&
                      selectedPlantIds.length < filteredPlants.length
                    }
                    checked={
                      filteredPlants.length > 0 &&
                      selectedPlantIds.length === filteredPlants.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Plant</TableCell>
                <TableCell>Strain</TableCell>
                <TableCell>Phase</TableCell>
                <TableCell>Days in Phase</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Medium</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlants.map((plant) => (
                <TableRow
                  key={plant.id}
                  hover
                  selected={selectedPlantIds.includes(plant.id)}
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/plant/${plant.id}`)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPlantIds.includes(plant.id)}
                      onChange={(e) =>
                        handleSelectPlant(plant.id, e.target.checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{plant.name}</Typography>
                      {plant.is_mother_plant && (
                        <Chip
                          label="Mother"
                          size="small"
                          color="success"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{plant.strain}</TableCell>
                  <TableCell>
                    <Chip
                      label={(() => {
                        let lastStartedIndex = -1;
                        for (let i = 0; i < plant.phases.length; i++) {
                          if (plant.phases[i].start_date) {
                            lastStartedIndex = i;
                          }
                        }
                        return lastStartedIndex >= 0
                          ? plant.phases[lastStartedIndex].name
                          : "Unknown";
                      })()}
                      size="small"
                      color={
                        getPhaseColor(
                          (() => {
                            let lastStartedIndex = -1;
                            for (let i = 0; i < plant.phases.length; i++) {
                              if (plant.phases[i].start_date) {
                                lastStartedIndex = i;
                              }
                            }
                            return lastStartedIndex >= 0
                              ? plant.phases[lastStartedIndex].name
                              : "";
                          })()
                        ) as any
                      }
                    />
                  </TableCell>
                  <TableCell>{getDaysInPhase(plant)}</TableCell>
                  <TableCell>{getTotalDays(plant)}</TableCell>
                  <TableCell>
                    <Chip
                      label={plant.medium}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {plant.phases.find((p) => p.start_date)
                      ? format(
                          new Date(
                            plant.phases.find((p) => p.start_date)!.start_date!
                          ),
                          "MMM dd, yyyy"
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plant.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={plant.is_active ? "success" : "default"}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      {plants.length === 0
                        ? "No plants yet"
                        : "No plants match your filters"}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Pflanzen löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie {selectedPlantIds.length} Pflanze(n)
            löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={executeBulkAction}
            color="error"
            variant="contained"
            disabled={deletePlantMutation.isPending}
          >
            {deletePlantMutation.isPending ? "Löschen..." : "Löschen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate/Activate Confirmation Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
      >
        <DialogTitle>
          Pflanzen {bulkAction === "activate" ? "aktivieren" : "deaktivieren"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie {selectedPlantIds.length} Pflanze(n){" "}
            {bulkAction === "activate" ? "aktivieren" : "deaktivieren"} möchten?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={executeBulkAction}
            variant="contained"
            disabled={updatePlantMutation.isPending}
          >
            {updatePlantMutation.isPending
              ? "Wird ausgeführt..."
              : bulkAction === "activate"
              ? "Aktivieren"
              : "Deaktivieren"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantsOverview;
