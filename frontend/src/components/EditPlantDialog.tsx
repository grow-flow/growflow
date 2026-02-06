import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Plant } from "../types/models";

interface EditPlantDialogProps {
  open: boolean;
  plant: Plant;
  onClose: () => void;
  onSave: (data: Partial<Plant>) => Promise<void>;
}

const EditPlantDialog: React.FC<EditPlantDialogProps> = ({ open, plant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plant.name,
    strain: plant.strain,
    notes: plant.notes || "",
    is_mother_plant: plant.is_mother_plant,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: plant.name,
      strain: plant.strain,
      notes: plant.notes || "",
      is_mother_plant: plant.is_mother_plant,
    });
  }, [plant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name: formData.name,
        strain: formData.strain,
        notes: formData.notes || undefined,
        is_mother_plant: formData.is_mother_plant,
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
              <TextField
                fullWidth
                label="Strain"
                value={formData.strain}
                onChange={(e) => setFormData({ ...formData, strain: e.target.value })}
                required
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

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_mother_plant}
                    onChange={(e) => setFormData({ ...formData, is_mother_plant: e.target.checked })}
                  />
                }
                label="Mother Plant"
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
