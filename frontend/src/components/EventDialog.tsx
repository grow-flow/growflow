import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
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
  return (
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
        <TextField
          label="Date & Time"
          type="datetime-local"
          value={eventData.timestamp}
          onChange={(e) => onChange({ ...eventData, timestamp: e.target.value })}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{
            shrink: true,
          }}
        />
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
  );
};

export default EventDialog;