import React, { useState, useEffect } from "react";
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
  Autocomplete,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Plant } from "../types/models";
import { useStrains } from "../hooks/useStrains";

interface EditPlantDialogProps {
  open: boolean;
  plant: Plant;
  onClose: () => void;
  onSave: (data: Partial<Plant>) => Promise<void>;
}

const EditPlantDialog: React.FC<EditPlantDialogProps> = ({ open, plant, onClose, onSave }) => {
  const { data: strains = [] } = useStrains();
  const [formData, setFormData] = useState({
    name: plant.name,
    strainId: plant.strainId,
    notes: plant.notes || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: plant.name,
      strainId: plant.strainId,
      notes: plant.notes || "",
    });
  }, [plant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name: formData.name,
        strainId: formData.strainId,
        notes: formData.notes || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update plant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Plant</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={strains}
                getOptionLabel={(opt) => opt.name}
                value={strains.find((s) => s.id === formData.strainId) || null}
                onChange={(_, val) => {
                  setFormData({ ...formData, strainId: val?.id });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Strain" />
                )}
                renderOption={(props, option) => (
                  <ListItem {...props}>
                    <ListItemText primary={option.name} secondary={option.type} />
                  </ListItem>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditPlantDialog;
