import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  Autocomplete,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useStrains, useCreateStrain } from "../hooks/useStrains";
import { usePlants } from "../hooks/usePlants";
import { CreatePlantRequest, PlantPhase } from "../types/models";
import { Strain } from "../types/strain";

const DEFAULT_PHASES: Omit<PlantPhase, 'id' | 'plantId'>[] = [
  { name: 'Germination', durationMin: 3, durationMax: 7, isActive: true, isCompleted: false },
  { name: 'Seedling', durationMin: 14, durationMax: 21, isActive: false, isCompleted: false },
  { name: 'Vegetation', durationMin: 21, durationMax: 60, isActive: false, isCompleted: false },
  { name: 'Pre-Flower', durationMin: 7, durationMax: 14, isActive: false, isCompleted: false },
  { name: 'Flowering', durationMin: 49, durationMax: 77, isActive: false, isCompleted: false },
  { name: 'Flushing', durationMin: 7, durationMax: 14, isActive: false, isCompleted: false },
  { name: 'Drying', durationMin: 7, durationMax: 14, isActive: false, isCompleted: false },
  { name: 'Curing', durationMin: 14, durationMax: 60, isActive: false, isCompleted: false }
];

interface CreatePlantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (plantData: CreatePlantRequest) => Promise<void>;
}

const CreatePlantDialog: React.FC<CreatePlantDialogProps> = ({ open, onClose, onSuccess }) => {
  const { data: strains = [] } = useStrains();
  const { data: plants = [] } = usePlants();
  const createStrainMutation = useCreateStrain();

  const [formData, setFormData] = useState({
    strainId: null as number | null,
  });
  const [newStrainName, setNewStrainName] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlantName = (strain: Strain | null, strainName: string) => {
    const abbr = strainName.substring(0, 3).toUpperCase();
    const existing = plants.filter((p) => p.name.startsWith(abbr));
    return `${abbr}-${(existing.length + 1).toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let strainId = formData.strainId;

      if (newStrainName && !strainId) {
        const newStrain = await createStrainMutation.mutateAsync({ name: newStrainName, type: "photoperiod" });
        strainId = newStrain.id;
      }

      const strain = strains.find((s) => s.id === strainId);
      const finalName = strain?.name || newStrainName;

      const plantData: CreatePlantRequest = {
        name: generatePlantName(strain || null, finalName),
        strainId: strainId || undefined,
        notes: "",
        phases: DEFAULT_PHASES.map((template, index) => ({
          ...template,
          isActive: index === 0,
          startDate: index === 0 ? new Date().toISOString() : undefined,
        })),
      };

      await onSuccess(plantData);
      setFormData({ strainId: null });
      setNewStrainName("");
    } catch (error) {
      console.error("Failed to create plant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ strainId: null });
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
                value={strains.find((s) => s.id === formData.strainId) || null}
                onChange={(_, val) => {
                  if (val && typeof val !== "string") {
                    setFormData({ ...formData, strainId: val.id });
                    setNewStrainName("");
                  } else {
                    setFormData({ ...formData, strainId: null });
                  }
                }}
                onInputChange={(_, val) => {
                  setNewStrainName(val);
                  if (val && !strains.find((s) => s.name.toLowerCase() === val.toLowerCase())) {
                    setFormData({ ...formData, strainId: null });
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
