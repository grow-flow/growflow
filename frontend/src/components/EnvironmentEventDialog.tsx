import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
  Typography,
  Collapse,
  IconButton,
  Chip,
  MenuItem,
} from "@mui/material";
import { Delete, Schedule } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { AreaEvent, AreaEventType, CreateAreaEventRequest } from "../types/models";
import { calculateVPD } from "../utils/vpd";
import { LIGHT_SCHEDULE_PRESETS } from "./CreateAreaDialog";

export const AREA_EVENT_META: Record<AreaEventType, { icon: string; color: string; label: string }> = {
  light_schedule: { icon: "💡", color: "#FFC107", label: "Light Schedule" },
  environment: { icon: "🌡️", color: "#4CAF50", label: "Environment" },
  equipment: { icon: "🔧", color: "#607D8B", label: "Equipment" },
  note: { icon: "📝", color: "#9E9E9E", label: "Note" },
};

const EVENT_TYPES: AreaEventType[] = ["light_schedule", "environment", "equipment", "note"];

const EQUIPMENT_TYPES = [
  "Exhaust Fan",
  "Intake Fan",
  "Carbon Filter",
  "Humidifier",
  "Dehumidifier",
  "Heater",
  "AC",
  "Light",
  "CO2 Generator",
  "Other",
];

interface EnvironmentEventDialogProps {
  open: boolean;
  event?: AreaEvent | null;
  initialType?: AreaEventType;
  onClose: () => void;
  onSubmit: (data: CreateAreaEventRequest) => Promise<void>;
  onDelete?: (eventId: number) => Promise<void>;
}

const EnvironmentEventDialog: React.FC<EnvironmentEventDialogProps> = ({
  open,
  event,
  initialType = "environment",
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [type, setType] = useState<AreaEventType>(initialType);
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [notes, setNotes] = useState("");
  const [data, setData] = useState<CreateAreaEventRequest["data"]>({});
  const [showTime, setShowTime] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setType(event.type);
      setTimestamp(event.timestamp);
      setNotes(event.notes || "");
      setData(event.data || {});
      setShowTime(true);
    } else {
      setType(initialType);
      setTimestamp(new Date().toISOString());
      setNotes("");
      setData({});
      setShowTime(false);
    }
  }, [open, event, initialType]);

  const meta = AREA_EVENT_META[type];

  const updateData = (field: string, value: string | number | undefined) => {
    setData((prev) => ({ ...prev, [field]: value === "" || value === undefined ? undefined : value }));
  };

  // Auto-calculate VPD when temp + humidity present. We only show the raw
  // value here — phase-aware judgement of "is this VPD ok?" lives on the
  // plant happiness indicator, not on this area-level reading dialog.
  const vpdValue = React.useMemo(() => {
    if (type === "environment" && data?.temperature_c !== undefined && data?.humidity_percent !== undefined) {
      return calculateVPD(data.temperature_c, data.humidity_percent);
    }
    return null;
  }, [type, data?.temperature_c, data?.humidity_percent]);

  const buildTitle = (): string => {
    if (type === "light_schedule" && data?.schedule) return `Schedule: ${data.schedule}`;
    if (type === "environment") {
      const parts: string[] = [];
      if (data?.temperature_c !== undefined) parts.push(`${data.temperature_c}°C`);
      if (data?.humidity_percent !== undefined) parts.push(`${data.humidity_percent}%`);
      return parts.length ? parts.join(" · ") : "Environment reading";
    }
    if (type === "equipment" && data?.equipment_type) {
      return `${data.equipment_type}${data.action ? ` (${data.action})` : ""}`;
    }
    return meta.label;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: CreateAreaEventRequest = {
        type,
        title: buildTitle(),
        timestamp,
        notes: notes || undefined,
        data,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Failed to save area event:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (type) {
      case "light_schedule":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Light Schedule
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {LIGHT_SCHEDULE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={data?.schedule === preset ? "contained" : "outlined"}
                    onClick={() => updateData("schedule", preset)}
                  >
                    {preset}
                  </Button>
                ))}
                <TextField
                  size="small"
                  placeholder="Custom"
                  value={
                    data?.schedule && !(LIGHT_SCHEDULE_PRESETS as readonly string[]).includes(data.schedule)
                      ? data.schedule
                      : ""
                  }
                  onChange={(e) => updateData("schedule", e.target.value || undefined)}
                  sx={{ minWidth: 120 }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="Light on"
                type="time"
                value={data?.light_on ?? ""}
                onChange={(e) => updateData("light_on", e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Intensity"
                type="number"
                value={data?.intensity_percent ?? ""}
                onChange={(e) => updateData("intensity_percent", e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100 }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        );
      case "environment":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="Temperature"
                type="number"
                value={data?.temperature_c ?? ""}
                onChange={(e) =>
                  updateData("temperature_c", e.target.value ? Number(e.target.value) : undefined)
                }
                InputProps={{ endAdornment: <InputAdornment position="end">°C</InputAdornment> }}
                inputProps={{ step: 0.1 }}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Humidity"
                type="number"
                value={data?.humidity_percent ?? ""}
                onChange={(e) =>
                  updateData("humidity_percent", e.target.value ? Number(e.target.value) : undefined)
                }
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100, step: 1 }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            {vpdValue !== null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  VPD:
                </Typography>
                <Chip label={`${vpdValue} kPa`} size="small" />
              </Box>
            )}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="CO₂"
                type="number"
                value={data?.co2_ppm ?? ""}
                onChange={(e) => updateData("co2_ppm", e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{ endAdornment: <InputAdornment position="end">ppm</InputAdornment> }}
                inputProps={{ min: 0, step: 10 }}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Light PPFD"
                type="number"
                value={data?.light_ppfd ?? ""}
                onChange={(e) =>
                  updateData("light_ppfd", e.target.value ? Number(e.target.value) : undefined)
                }
                InputProps={{ endAdornment: <InputAdornment position="end">μmol</InputAdornment> }}
                inputProps={{ min: 0, step: 10 }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        );
      case "equipment":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                select
                label="Equipment"
                value={data?.equipment_type ?? ""}
                onChange={(e) => updateData("equipment_type", e.target.value || undefined)}
                size="small"
                sx={{ flex: 2 }}
              >
                {EQUIPMENT_TYPES.map((eq) => (
                  <MenuItem key={eq} value={eq}>
                    {eq}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Action"
                value={data?.action ?? ""}
                onChange={(e) => updateData("action", e.target.value || undefined)}
                size="small"
                sx={{ flex: 1 }}
              >
                <MenuItem value="installed">Installed</MenuItem>
                <MenuItem value="removed">Removed</MenuItem>
                <MenuItem value="adjusted">Adjusted</MenuItem>
              </TextField>
            </Box>
            <TextField
              label="Details"
              value={data?.details ?? ""}
              onChange={(e) => updateData("details", e.target.value || undefined)}
              size="small"
              fullWidth
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: "1.3em" }}>{meta.icon}</span>
            <Typography variant="h6">
              {event ? "Edit " : ""}
              {meta.label}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              size="small"
              onClick={() => setShowTime(!showTime)}
              color={showTime ? "primary" : "default"}
            >
              <Schedule fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          {!event && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {EVENT_TYPES.map((t) => {
                const m = AREA_EVENT_META[t];
                const active = type === t;
                return (
                  <IconButton
                    key={t}
                    onClick={() => {
                      setType(t);
                      setData({});
                    }}
                    sx={{
                      fontSize: "1.3rem",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: active ? m.color : "divider",
                      bgcolor: active ? `${m.color}20` : "transparent",
                    }}
                    title={m.label}
                  >
                    {m.icon}
                  </IconButton>
                );
              })}
            </Box>
          )}

          <Collapse in={showTime}>
            <DateTimePicker
              value={new Date(timestamp)}
              onChange={(d) => d && setTimestamp(d.toISOString())}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
              format="dd/MM/yy HH:mm"
            />
          </Collapse>

          {renderFields()}

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Box>
            {event && onDelete && (
              <Button
                onClick={async () => {
                  await onDelete(event.id);
                  onClose();
                }}
                color="error"
                startIcon={<Delete />}
                size="small"
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} size="small">
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" size="small" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EnvironmentEventDialog;
