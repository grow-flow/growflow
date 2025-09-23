import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PlantEvent } from "../types/models";

interface EventDialogProps {
  open: boolean;
  event: PlantEvent | null;
  eventData: {
    title: string;
    notes: string;
    timestamp: string;
  };
  onClose: () => void;
  onSave: () => void;
  onChange: (data: { title: string; notes: string; timestamp: string }) => void;
}

const EventDialog: React.FC<EventDialogProps> = ({
  open,
  event,
  eventData,
  onClose,
  onSave,
  onChange,
}) => {
  const eventDateTime = new Date(eventData.timestamp);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const newDateTime = new Date(eventDateTime);
      newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      onChange({ ...eventData, timestamp: newDateTime.toISOString() });
    }
  };

  const handleTimeChange = (time: Date | null) => {
    if (time) {
      const newDateTime = new Date(eventDateTime);
      newDateTime.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
      onChange({ ...eventData, timestamp: newDateTime.toISOString() });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {event ? "Edit Event" : "Create Event"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={eventData.title}
            onChange={(e) => onChange({ ...eventData, title: e.target.value })}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <DatePicker
              format="dd/MM/yy"
              value={eventDateTime}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: "medium",
                  fullWidth: true,
                  label: "Date",
                },
                actionBar: { actions: ["clear", "today"] },
              }}
            />
            <TimePicker
              value={eventDateTime}
              onChange={handleTimeChange}
              slotProps={{
                textField: {
                  size: "medium",
                  fullWidth: true,
                  label: "Time",
                },
              }}
            />
          </Box>
          <TextField
            label="Notes"
            value={eventData.notes}
            onChange={(e) => onChange({ ...eventData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} variant="contained">
            {event ? "Update Event" : "Create Event"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventDialog;