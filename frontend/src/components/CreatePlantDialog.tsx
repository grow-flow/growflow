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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useStrains, useCreateStrain } from "../hooks/useStrains";
import { usePlants } from "../hooks/usePlants";
import { CreatePlantRequest } from "../types/models";
import { Strain } from "../types/strain";

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
    plantName: "",
    sourceType: "seed" as "seed" | "clone",
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

      const plantData: CreatePlantRequest = {
        name: formData.plantName,
        strainId: strainId || undefined,
        sourceType: formData.sourceType,
        notes: "",
      };

      await onSuccess(plantData);
      setFormData({ strainId: null, plantName: "", sourceType: "seed" });
      setNewStrainName("");
    } catch (error) {
      console.error("Failed to create plant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ strainId: null, plantName: "", sourceType: "seed" });
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
                    const autoName = generatePlantName(val, val.name);
                    setFormData({ ...formData, strainId: val.id, plantName: autoName });
                    setNewStrainName("");
                  } else {
                    setFormData({ ...formData, strainId: null, plantName: "" });
                  }
                }}
                onInputChange={(_, val) => {
                  setNewStrainName(val);
                  if (val && !strains.find((s) => s.name.toLowerCase() === val.toLowerCase())) {
                    const autoName = generatePlantName(null, val);
                    setFormData({ ...formData, strainId: null, plantName: autoName });
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
              <Typography variant="body2" sx={{ mb: 1 }}>Source Type</Typography>
              <ToggleButtonGroup
                value={formData.sourceType}
                exclusive
                onChange={(_, val) => val && setFormData({ ...formData, sourceType: val })}
                fullWidth
                size="small"
              >
                <ToggleButton value="seed">Seed</ToggleButton>
                <ToggleButton value="clone">Clone</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {(formData.strainId || newStrainName) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plant Name"
                  value={formData.plantName}
                  onChange={(e) => setFormData({ ...formData, plantName: e.target.value })}
                  required
                />
              </Grid>
            )}
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
