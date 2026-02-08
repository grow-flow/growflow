import React, { useState } from "react";
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
} from "@mui/material";
import { Delete, Schedule } from "@mui/icons-material";

const EVENT_TYPES: PlantEvent["type"][] = ["watering", "note", "training", "harvest"];
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PlantEvent } from "@/types/models";
import ImageUpload from "./ImageUpload";

export const EVENT_META: Record<string, { icon: string; color: string; label: string }> = {
  watering: { icon: "💧", color: "#2196F3", label: "Watering" },
  note: { icon: "📸", color: "#FF9800", label: "Note" },
  training: { icon: "✂️", color: "#9C27B0", label: "Training" },
  harvest: { icon: "🌾", color: "#795548", label: "Harvest" },
  observation: { icon: "👁️", color: "#FF9800", label: "Observation" },
  transplant: { icon: "🪴", color: "#607D8B", label: "Transplant" },
  custom: { icon: "📝", color: "#616161", label: "Custom" },
};

export const getEventIcon = (type: string) => EVENT_META[type]?.icon || "📝";
export const getEventColor = (type: string) => EVENT_META[type]?.color || "#616161";

export interface EventFormData {
  type: PlantEvent["type"];
  title: string;
  notes: string;
  timestamp: string;
  data?: PlantEvent["data"];
}

interface EventDialogProps {
  open: boolean;
  event: PlantEvent | null;
  eventData: EventFormData;
  pendingFiles: File[];
  onClose: () => void;
  onSave: () => void;
  onDelete?: (eventId: number) => void;
  onChange: (data: EventFormData) => void;
  onFilesChange: (files: File[]) => void;
  onPhotoRemove: (photo: string) => void;
}

const EventDialog: React.FC<EventDialogProps> = ({
  open,
  event,
  eventData,
  pendingFiles,
  onClose,
  onSave,
  onDelete,
  onChange,
  onFilesChange,
  onPhotoRemove,
}) => {
  const [showTime, setShowTime] = useState(!!event);
  const meta = EVENT_META[eventData.type] || EVENT_META.note;

  const handleTypeChange = (type: PlantEvent["type"]) => {
    onChange({ ...eventData, type, title: EVENT_META[type]?.label || type, data: {} });
  };

  const updateData = (field: string, value: string | number | undefined) => {
    onChange({ ...eventData, data: { ...eventData.data, [field]: value === "" ? undefined : value } });
  };

  const renderFields = () => {
    switch (eventData.type) {
      case "watering":
        return (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              label="ml"
              type="number"
              value={eventData.data?.amount_ml ?? ""}
              onChange={(e) => updateData("amount_ml", e.target.value ? Number(e.target.value) : undefined)}
              inputProps={{ min: 0, step: 50 }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="pH"
              type="number"
              value={eventData.data?.ph_level ?? ""}
              onChange={(e) => updateData("ph_level", e.target.value ? Number(e.target.value) : undefined)}
              inputProps={{ min: 0, max: 14, step: 0.1 }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="EC"
              type="number"
              value={eventData.data?.ec_ppm ?? ""}
              onChange={(e) => updateData("ec_ppm", e.target.value ? Number(e.target.value) : undefined)}
              InputProps={{ endAdornment: <InputAdornment position="end">ppm</InputAdornment> }}
              inputProps={{ min: 0, step: 10 }}
              size="small"
              sx={{ flex: 1 }}
            />
          </Box>
        );
      case "training":
        return (
          <TextField
            label="Method"
            placeholder="LST, Topping, Defoliation..."
            value={eventData.data?.training_method ?? ""}
            onChange={(e) => updateData("training_method", e.target.value || undefined)}
            fullWidth
            size="small"
          />
        );
      case "harvest":
        return (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              label="Wet weight"
              type="number"
              value={eventData.data?.wet_weight ?? ""}
              onChange={(e) => updateData("wet_weight", e.target.value ? Number(e.target.value) : undefined)}
              InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }}
              inputProps={{ min: 0, step: 1 }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Dry weight"
              type="number"
              value={eventData.data?.dry_weight ?? ""}
              onChange={(e) => updateData("dry_weight", e.target.value ? Number(e.target.value) : undefined)}
              InputProps={{ endAdornment: <InputAdornment position="end">g</InputAdornment> }}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              sx={{ flex: 1 }}
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
              {event ? "Edit" : ""} {meta.label}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={() => setShowTime(!showTime)} color={showTime ? "primary" : "default"}>
              <Schedule fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          {!event && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {EVENT_TYPES.map((t) => {
                const m = EVENT_META[t];
                const active = eventData.type === t;
                return (
                  <IconButton
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    sx={{
                      fontSize: "1.3rem",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: active ? m.color : "divider",
                      bgcolor: active ? `${m.color}20` : "transparent",
                    }}
                  >
                    {m.icon}
                  </IconButton>
                );
              })}
            </Box>
          )}

          <Collapse in={showTime}>
            <DateTimePicker
              value={new Date(eventData.timestamp)}
              onChange={(d) => d && onChange({ ...eventData, timestamp: d.toISOString() })}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
              format="dd/MM/yy HH:mm"
            />
          </Collapse>

          {renderFields()}

          <TextField
            label="Notes"
            value={eventData.notes}
            onChange={(e) => onChange({ ...eventData, notes: e.target.value })}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
          />

          <ImageUpload
            photos={eventData.data?.photos || []}
            pendingFiles={pendingFiles}
            onFilesAdd={(files) => onFilesChange([...pendingFiles, ...files])}
            onFileRemove={(i) => onFilesChange(pendingFiles.filter((_, idx) => idx !== i))}
            onExistingRemove={onPhotoRemove}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Box>
            {event && onDelete && (
              <Button onClick={() => { onDelete(event.id); onClose(); }} color="error" startIcon={<Delete />} size="small">
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} size="small">Cancel</Button>
            <Button onClick={onSave} variant="contained" size="small">Save</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventDialog;
