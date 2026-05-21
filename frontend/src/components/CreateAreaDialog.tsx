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
} from "@mui/material";
import { AreaType, CreateAreaRequest, GrowArea } from "../types/models";

export const LIGHT_SCHEDULE_PRESETS = ["18/6", "20/4", "12/12", "24/0"] as const;

export const AREA_TYPES: { value: AreaType; label: string; icon: string }[] = [
  { value: "tent", label: "Tent", icon: "⛺" },
  { value: "room", label: "Room", icon: "🏠" },
  { value: "outdoor", label: "Outdoor", icon: "🌞" },
  { value: "closet", label: "Closet", icon: "🚪" },
  { value: "custom", label: "Custom", icon: "📦" },
];

interface CreateAreaDialogProps {
  open: boolean;
  area?: GrowArea | null;
  onClose: () => void;
  onSubmit: (data: CreateAreaRequest) => Promise<void>;
}

const CreateAreaDialog: React.FC<CreateAreaDialogProps> = ({ open, area, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateAreaRequest>({
    name: area?.name || "",
    type: area?.type || "tent",
    description: area?.description || "",
    lightSchedule: area?.lightSchedule || "",
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: area?.name || "",
        type: area?.type || "tent",
        description: area?.description || "",
        lightSchedule: area?.lightSchedule || "",
      });
    }
  }, [open, area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        lightSchedule: formData.lightSchedule || undefined,
        description: formData.description || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save area:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{area ? "Edit Grow Area" : "Create Grow Area"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                placeholder="e.g. Veg Tent, Flower Room"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AreaType })}
                >
                  {AREA_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1 }} color="textSecondary">
                Light Schedule
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {LIGHT_SCHEDULE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={formData.lightSchedule === preset ? "contained" : "outlined"}
                    onClick={() => setFormData({ ...formData, lightSchedule: preset })}
                  >
                    {preset}
                  </Button>
                ))}
                <TextField
                  size="small"
                  placeholder="Custom (e.g. 16/8)"
                  value={
                    formData.lightSchedule && !LIGHT_SCHEDULE_PRESETS.includes(formData.lightSchedule as any)
                      ? formData.lightSchedule
                      : ""
                  }
                  onChange={(e) => setFormData({ ...formData, lightSchedule: e.target.value })}
                  sx={{ minWidth: 140 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                minRows={2}
                maxRows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.name.trim()}>
            {loading ? "Saving..." : area ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateAreaDialog;
