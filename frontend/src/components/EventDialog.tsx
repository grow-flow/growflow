import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Typography,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PlantEvent } from "../types/models";
import { EVENT_TYPES, QUICK_EVENT_TEMPLATES, EventType } from "../config/eventTypes";
import WateringForm from "./events/WateringForm";
import TrainingForm from "./events/TrainingForm";

interface EventDialogProps {
  open: boolean;
  event: PlantEvent | null;
  eventData: {
    type: PlantEvent['type'];
    title: string;
    notes: string;
    timestamp: string;
    data?: PlantEvent['data'];
  };
  onClose: () => void;
  onSave: () => void;
  onDelete?: (eventId: string) => void;
  onChange: (data: { 
    type: PlantEvent['type']; 
    title: string; 
    notes: string; 
    timestamp: string; 
    data?: PlantEvent['data'];
  }) => void;
}

const EventDialog: React.FC<EventDialogProps> = ({
  open,
  event,
  eventData,
  onClose,
  onSave,
  onDelete,
  onChange,
}) => {
  const eventDateTime = new Date(eventData.timestamp);
  const eventType = EVENT_TYPES[eventData.type as EventType];
  const templates = QUICK_EVENT_TEMPLATES[eventData.type as EventType];

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

  const handleTypeChange = (type: PlantEvent['type']) => {
    onChange({ 
      ...eventData, 
      type,
      title: EVENT_TYPES[type]?.title || '',
      data: {} // Reset data when changing type
    });
  };

  const handleDataChange = (data: PlantEvent['data']) => {
    onChange({ ...eventData, data });
  };

  const handleTemplateClick = (template: any) => {
    onChange({
      ...eventData,
      title: template.title,
      data: { ...eventData.data, ...template.data }
    });
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const renderEventForm = () => {
    switch (eventData.type) {
      case 'watering':
        return <WateringForm data={eventData.data} onChange={handleDataChange} />;
      case 'training':
        return <TrainingForm data={eventData.data} onChange={handleDataChange} />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {eventType && (
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.5em' }}>{eventType.icon}</span>
                {event ? "Edit" : "Create"} {eventType.title}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 0 }}>
          {/* Event Type Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventData.type}
              onChange={(e) => handleTypeChange(e.target.value as PlantEvent['type'])}
              disabled={!!event} // Don't allow changing type when editing
            >
              {Object.entries(EVENT_TYPES).map(([key, type]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{type.icon}</span>
                    {type.title}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Quick Templates */}
          {templates && templates.length > 0 && !event && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Templates</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {templates.map((template, index) => (
                  <Chip
                    key={index}
                    label={template.title}
                    variant="outlined"
                    clickable
                    onClick={() => handleTemplateClick(template)}
                    size="small"
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          {/* Basic Fields */}
          <TextField
            label="Title"
            value={eventData.title}
            onChange={(e) => onChange({ ...eventData, title: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
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

          {/* Event-specific form fields */}
          {renderEventForm()}

          {/* Notes */}
          <TextField
            label="Notes"
            value={eventData.notes}
            onChange={(e) => onChange({ ...eventData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Box>
            {event && onDelete && (
              <Button 
                onClick={handleDelete} 
                color="error" 
                startIcon={<Delete />}
                variant="outlined"
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave} variant="contained">
              {event ? "Update Event" : "Create Event"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EventDialog;