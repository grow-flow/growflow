import React, { useState } from "react";
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
  Box,
  Typography,
  Autocomplete,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useStrains, useCreateStrain } from "../hooks/useStrains";
import { usePlants } from "../hooks/usePlants";
import { Plant, PhaseTemplate } from "../types/models";
import { Strain, StartMethod } from "../types/strain";

const DEFAULT_PHASES: PhaseTemplate[] = [
  { name: 'Germination', duration_min: 3, duration_max: 7, description: 'Seeds sprouting' },
  { name: 'Seedling', duration_min: 14, duration_max: 21, description: 'First leaves developing' },
  { name: 'Vegetation', duration_min: 21, duration_max: 60, description: 'Rapid growth phase' },
  { name: 'Pre-Flower', duration_min: 7, duration_max: 14, description: 'Transition to flowering' },
  { name: 'Flowering', duration_min: 49, duration_max: 77, description: 'Producing buds' },
  { name: 'Flushing', duration_min: 7, duration_max: 14, description: 'Final flush' },
  { name: 'Drying', duration_min: 7, duration_max: 14, description: 'Drying buds' },
  { name: 'Curing', duration_min: 14, duration_max: 60, description: 'Final curing' }
];

interface CreatePlantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (plantData: Partial<Plant>) => Promise<void>;
}

const CreatePlantDialog: React.FC<CreatePlantDialogProps> = ({ open, onClose, onSuccess }) => {
  const { data: strains = [] } = useStrains();
  const { data: plants = [] } = usePlants();
  const createStrainMutation = useCreateStrain();

  const [formData, setFormData] = useState({
    strain_id: null as number | null,
    start_method: "seed" as StartMethod,
  });
  const [newStrainName, setNewStrainName] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlantName = (strain: Strain | null, strainName: string) => {
    const abbr = strain?.abbreviation || strainName.substring(0, 3).toUpperCase();
    const existing = plants.filter((p) => p.name.startsWith(abbr));
    return `${abbr}-${(existing.length + 1).toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let strainId = formData.strain_id;

      if (newStrainName && !strainId) {
        const newStrain = await createStrainMutation.mutateAsync({ name: newStrainName, type: "photoperiod" });
        strainId = newStrain.id;
      }

      const strain = strains.find((s) => s.id === strainId);
      const finalName = strain?.name || newStrainName;

      const plantData: Partial<Plant> = {
        name: generatePlantName(strain || null, finalName),
        strain: finalName,
        start_method: formData.start_method,
        plant_type: strain?.type || "photoperiod",
        notes: "",
        phases: DEFAULT_PHASES.map((template, index) => ({
          id: `phase-${index}-${Date.now()}`,
          name: template.name,
          duration_min: template.duration_min,
          duration_max: template.duration_max,
          description: template.description,
          is_active: index === 0,
          is_completed: false,
          start_date: index === 0 ? new Date().toISOString() : undefined,
        })),
        events: [],
        is_active: true,
      };

      await onSuccess(plantData);
      setFormData({ strain_id: null, start_method: "seed" });
      setNewStrainName("");
    } catch (error) {
      console.error("Failed to create plant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ strain_id: null, start_method: "seed" });
    setNewStrainName("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Plant</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={strains}
                getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
                value={strains.find((s) => s.id === formData.strain_id) || null}
                onChange={(_, val) => {
                  if (val && typeof val !== "string") {
                    setFormData({ ...formData, strain_id: val.id });
                    setNewStrainName("");
                  } else {
                    setFormData({ ...formData, strain_id: null });
                  }
                }}
                onInputChange={(_, val) => {
                  setNewStrainName(val);
                  if (val && !strains.find((s) => s.name.toLowerCase() === val.toLowerCase())) {
                    setFormData({ ...formData, strain_id: null });
                  }
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField {...params} label="Strain" required helperText="Select or create new" />
                )}
                renderOption={(props, option) => (
                  <ListItem {...props}>
                    <ListItemText primary={option.name} secondary={option.type} />
                  </ListItem>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Start Method</InputLabel>
                <Select
                  value={formData.start_method}
                  label="Start Method"
                  onChange={(e) => setFormData({ ...formData, start_method: e.target.value as StartMethod })}
                >
                  <MenuItem value="seed">Seed</MenuItem>
                  <MenuItem value="clone">Clone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {newStrainName && !strains.find((s) => s.name.toLowerCase() === newStrainName.toLowerCase()) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
              <Typography variant="body2" color="info.contrastText">
                Creating new strain: <strong>{newStrainName}</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Creating..." : "Add Plant"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlantDialog;
