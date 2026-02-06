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
import { PlantPhase } from "@/types/models";

interface PhaseEditDialogProps {
  phase: PlantPhase | null;
  open: boolean;
  onClose: () => void;
  onSave: (phase: PlantPhase) => void;
}

export const PhaseEditDialog: React.FC<PhaseEditDialogProps> = ({
  phase,
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    durationMin: 7,
    durationMax: 14,
    notes: ''
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        durationMin: phase.durationMin,
        durationMax: phase.durationMax,
        notes: phase.notes || ''
      });
    } else {
      setFormData({
        name: '',
        durationMin: 7,
        durationMax: 14,
        notes: ''
      });
    }
  }, [phase, open]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Phase name is required');
      return;
    }

    if (formData.durationMin <= 0 || formData.durationMax <= 0) {
      alert('Duration must be positive numbers');
      return;
    }

    if (formData.durationMin > formData.durationMax) {
      alert('Minimum duration cannot be greater than maximum duration');
      return;
    }

    const savedPhase: PlantPhase = phase
      ? {
          ...phase,
          name: formData.name.trim(),
          durationMin: formData.durationMin,
          durationMax: formData.durationMax,
          notes: formData.notes.trim() || undefined
        }
      : {
          id: 0,
          plantId: 0,
          name: formData.name.trim(),
          durationMin: formData.durationMin,
          durationMax: formData.durationMax,
          notes: formData.notes.trim() || undefined,
          isActive: false,
          isCompleted: false
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
            value={formData.durationMin}
            onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Max Duration (days)"
            type="number"
            value={formData.durationMax}
            onChange={(e) => setFormData({ ...formData, durationMax: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />
        </Box>

        <TextField
          label="Notes (optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
