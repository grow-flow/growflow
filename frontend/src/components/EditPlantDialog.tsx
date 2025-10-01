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

const EditPlantDialog: React.FC<EditPlantDialogProps> = ({
  open,
  plant,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: plant.name,
    strain: plant.strain,
    breeder: plant.breeder || "",
    phenotype: plant.phenotype || "",
    medium: plant.medium,
    pot_size_liters: plant.pot_size_liters,
    notes: plant.notes || "",
    is_mother_plant: plant.is_mother_plant,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: plant.name,
      strain: plant.strain,
      breeder: plant.breeder || "",
      phenotype: plant.phenotype || "",
      medium: plant.medium,
      pot_size_liters: plant.pot_size_liters,
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
        breeder: formData.breeder || undefined,
        phenotype: formData.phenotype || undefined,
        medium: formData.medium,
        pot_size_liters: formData.pot_size_liters,
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Plant</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plant Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Strain"
                value={formData.strain}
                onChange={(e) =>
                  setFormData({ ...formData, strain: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Breeder"
                value={formData.breeder}
                onChange={(e) =>
                  setFormData({ ...formData, breeder: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phenotype"
                value={formData.phenotype}
                onChange={(e) =>
                  setFormData({ ...formData, phenotype: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Growing Medium</InputLabel>
                <Select
                  value={formData.medium}
                  label="Growing Medium"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medium: e.target.value as Plant["medium"],
                    })
                  }
                >
                  <MenuItem value="soil">Soil</MenuItem>
                  <MenuItem value="coco">Coco Coir</MenuItem>
                  <MenuItem value="hydro">Hydroponic</MenuItem>
                  <MenuItem value="dwc">DWC</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Pot Size (Liters)"
                value={formData.pot_size_liters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pot_size_liters: parseFloat(e.target.value),
                  })
                }
                required
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_mother_plant}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_mother_plant: e.target.checked,
                      })
                    }
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
