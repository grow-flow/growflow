import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  InputAdornment,
} from "@mui/material";
import { PlantPhase, PhaseEnvTargets } from "@/types/models";

interface PhaseEditDialogProps {
  phase: PlantPhase | null;
  open: boolean;
  onClose: () => void;
  onSave: (phase: PlantPhase) => void;
}

interface FormState extends PhaseEnvTargets {
  name: string;
  durationMin: number;
  durationMax: number;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  durationMin: 7,
  durationMax: 14,
  notes: "",
  vpdMin: null, vpdMax: null,
  tempMin: null, tempMax: null,
  humidityMin: null, humidityMax: null,
  lightOnHours: null,
};

const numOrNull = (raw: string): number | null => {
  if (raw === "") return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
};

interface RangeFieldProps {
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  onMinChange: (v: number | null) => void;
  onMaxChange: (v: number | null) => void;
  step?: number;
}

const RangeField: React.FC<RangeFieldProps> = ({ label, unit, min, max, onMinChange, onMaxChange, step }) => (
  <Box>
    <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
      {label}
    </Typography>
    <Box sx={{ display: "flex", gap: 1 }}>
      <TextField
        size="small" type="number" placeholder="min"
        value={min ?? ""}
        onChange={(e) => onMinChange(numOrNull(e.target.value))}
        InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
        inputProps={{ step }}
        sx={{ flex: 1 }}
      />
      <TextField
        size="small" type="number" placeholder="max"
        value={max ?? ""}
        onChange={(e) => onMaxChange(numOrNull(e.target.value))}
        InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
        inputProps={{ step }}
        sx={{ flex: 1 }}
      />
    </Box>
  </Box>
);

export const PhaseEditDialog: React.FC<PhaseEditDialogProps> = ({
  phase,
  open,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (phase) {
      setForm({
        name: phase.name,
        durationMin: phase.durationMin,
        durationMax: phase.durationMax,
        notes: phase.notes || "",
        vpdMin: phase.vpdMin, vpdMax: phase.vpdMax,
        tempMin: phase.tempMin, tempMax: phase.tempMax,
        humidityMin: phase.humidityMin, humidityMax: phase.humidityMax,
        lightOnHours: phase.lightOnHours,
      });
    } else {
      setForm(EMPTY);
    }
  }, [phase, open]);

  const handleSave = () => {
    if (!form.name.trim()) return alert("Phase name is required");
    if (form.durationMin <= 0 || form.durationMax <= 0) return alert("Duration must be positive numbers");
    if (form.durationMin > form.durationMax) return alert("Minimum duration cannot be greater than maximum duration");

    const targets: PhaseEnvTargets = {
      vpdMin: form.vpdMin, vpdMax: form.vpdMax,
      tempMin: form.tempMin, tempMax: form.tempMax,
      humidityMin: form.humidityMin, humidityMax: form.humidityMax,
      lightOnHours: form.lightOnHours,
    };

    const saved: PlantPhase = phase
      ? {
          ...phase,
          name: form.name.trim(),
          durationMin: form.durationMin,
          durationMax: form.durationMax,
          notes: form.notes.trim() || undefined,
          ...targets,
        }
      : {
          id: 0,
          plantId: 0,
          sortOrder: 0,
          name: form.name.trim(),
          durationMin: form.durationMin,
          durationMax: form.durationMax,
          notes: form.notes.trim() || undefined,
          isActive: false,
          isCompleted: false,
          ...targets,
        };

    onSave(saved);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{phase ? "Edit Phase" : "Add New Phase"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          margin="normal"
          label="Phase Name"
          fullWidth
          variant="outlined"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Min Duration (days)"
            type="number"
            value={form.durationMin}
            onChange={(e) => update("durationMin", parseInt(e.target.value) || 0)}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Max Duration (days)"
            type="number"
            value={form.durationMax}
            onChange={(e) => update("durationMax", parseInt(e.target.value) || 0)}
            inputProps={{ min: 1 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Environment targets</Typography>
        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1.5 }}>
          Optional. Empty fields aren't scored — leave blank if this phase doesn't constrain a dimension.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
          <RangeField
            label="VPD" unit="kPa" step={0.1}
            min={form.vpdMin} max={form.vpdMax}
            onMinChange={(v) => update("vpdMin", v)}
            onMaxChange={(v) => update("vpdMax", v)}
          />
          <RangeField
            label="Temperature" unit="°C" step={0.5}
            min={form.tempMin} max={form.tempMax}
            onMinChange={(v) => update("tempMin", v)}
            onMaxChange={(v) => update("tempMax", v)}
          />
          <RangeField
            label="Humidity" unit="%" step={1}
            min={form.humidityMin} max={form.humidityMax}
            onMinChange={(v) => update("humidityMin", v)}
            onMaxChange={(v) => update("humidityMax", v)}
          />
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
              Light on hours
            </Typography>
            <TextField
              size="small" type="number" placeholder="e.g. 18 or 12"
              value={form.lightOnHours ?? ""}
              onChange={(e) => update("lightOnHours", numOrNull(e.target.value))}
              InputProps={{ endAdornment: <InputAdornment position="end">h / 24</InputAdornment> }}
              inputProps={{ step: 1, min: 0, max: 24 }}
              sx={{ width: 200 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        <TextField
          label="Notes (optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {phase ? "Save Changes" : "Add Phase"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
