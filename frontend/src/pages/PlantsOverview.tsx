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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { usePlants, useCreatePlant, useDeletePlant } from "../hooks/usePlants";
import { Plant, CreatePlantRequest } from "../types/models";
import CreatePlantDialog from "../components/CreatePlantDialog";

const getStrainName = (plant: Plant): string => plant.strain?.name || "Unknown";

const getCurrentPhase = (plant: Plant) => {
  let lastStartedIndex = -1;
  for (let i = 0; i < plant.phases.length; i++) {
    if (plant.phases[i].startDate) lastStartedIndex = i;
  }
  return lastStartedIndex >= 0 ? plant.phases[lastStartedIndex] : null;
};

const getPhaseColor = (phase: string) => {
  const colors: Record<string, "success" | "primary" | "warning" | "secondary" | "info" | "default"> = {
    germination: "success", seedling: "success", vegetation: "primary",
    "pre-flower": "warning", flowering: "secondary", flushing: "info",
  };
  return colors[phase.toLowerCase()] || "default";
};

const PlantsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [phaseFilter, setPhaseFilter] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plant | null>(null);

  const { data: plants = [], isLoading, error, refetch } = usePlants();
  const createMutation = useCreatePlant();
  const deleteMutation = useDeletePlant();

  const uniquePhases = Array.from(new Set(
    plants.map(p => getCurrentPhase(p)?.name).filter((n): n is string => Boolean(n))
  ));

  const filteredPlants = phaseFilter
    ? plants.filter(p => getCurrentPhase(p)?.name === phaseFilter)
    : plants;

  const handleCreate = async (data: CreatePlantRequest) => {
    await createMutation.mutateAsync(data);
    setCreateDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getDaysInPhase = (plant: Plant) => {
    const phase = getCurrentPhase(plant);
    return phase?.startDate ? differenceInDays(new Date(), new Date(phase.startDate)) : 0;
  };

  const getTotalDays = (plant: Plant) => {
    const first = plant.phases.find(p => p.startDate);
    return first?.startDate ? differenceInDays(new Date(), new Date(first.startDate)) : 0;
  };

  const getStartDate = (plant: Plant) => {
    const first = plant.phases.find(p => p.startDate);
    return first?.startDate ? format(new Date(first.startDate), "MMM dd, yyyy") : "N/A";
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
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        Failed to load plants.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Plants Overview</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Phase</InputLabel>
            <Select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)} label="Phase">
              <MenuItem value="">All Phases</MenuItem>
              {uniquePhases.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
            Add Plant
          </Button>
        </Box>
      </Box>

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
                <TableCell>Start Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell width={60} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlants.map(plant => {
                const phase = getCurrentPhase(plant);
                return (
                  <TableRow
                    key={plant.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/plant/${plant.id}`)}
                  >
                    <TableCell><Typography variant="subtitle2">{plant.name}</Typography></TableCell>
                    <TableCell>{getStrainName(plant)}</TableCell>
                    <TableCell>
                      <Chip label={phase?.name || "Unknown"} size="small" color={getPhaseColor(phase?.name || "")} />
                    </TableCell>
                    <TableCell>{getDaysInPhase(plant)}</TableCell>
                    <TableCell>{getTotalDays(plant)}</TableCell>
                    <TableCell>{getStartDate(plant)}</TableCell>
                    <TableCell>
                      <Chip label={plant.isActive ? "Active" : "Inactive"} size="small" color={plant.isActive ? "success" : "default"} />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(plant); }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPlants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      {plants.length === 0 ? "No plants yet" : "No plants match the filter"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CreatePlantDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreate} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Plant</DialogTitle>
        <DialogContent>
          <Typography>Delete "{deleteTarget?.name}"? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantsOverview;
