import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { PlantPhaseInstance } from "@/types/models";

interface PhaseEditDialogProps {
  phase: PlantPhaseInstance | null;
  open: boolean;
  onClose: () => void;
  onSave: (phase: PlantPhaseInstance) => void;
}

export const PhaseEditDialog: React.FC<PhaseEditDialogProps> = ({
  phase,
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    duration_min: 7,
    duration_max: 14,
    description: ''
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        duration_min: phase.duration_min,
        duration_max: phase.duration_max,
        description: phase.description || ''
      });
    } else {
      setFormData({
        name: '',
        duration_min: 7,
        duration_max: 14,
        description: ''
      });
    }
  }, [phase, open]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Phase name is required');
      return;
    }

    if (formData.duration_min <= 0 || formData.duration_max <= 0) {
      alert('Duration must be positive numbers');
      return;
    }

    if (formData.duration_min > formData.duration_max) {
      alert('Minimum duration cannot be greater than maximum duration');
      return;
    }

    const savedPhase: PlantPhaseInstance = phase
      ? {
          ...phase,
          name: formData.name.trim(),
          duration_min: formData.duration_min,
          duration_max: formData.duration_max,
          description: formData.description.trim() || undefined
        }
      : {
          id: crypto.randomUUID(),
          name: formData.name.trim(),
          duration_min: formData.duration_min,
          duration_max: formData.duration_max,
          description: formData.description.trim() || undefined,
          is_active: false,
          is_completed: false
        };

    onSave(savedPhase);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{phase ? 'Edit Phase' : 'Add New Phase'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          margin="normal"
          label="Phase Name"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Min Duration (days)"
            type="number"
            value={formData.duration_min}
            onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Max Duration (days)"
            type="number"
            value={formData.duration_max}
            onChange={(e) => setFormData({ ...formData, duration_max: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />
        </Box>

        <TextField
          label="Description (optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {phase ? 'Save Changes' : 'Add Phase'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
