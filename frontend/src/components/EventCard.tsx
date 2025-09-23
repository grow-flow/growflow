import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { MoreVert, Edit, Delete } from "@mui/icons-material";
import { PlantEvent } from "../types/models";

interface EventCardProps {
  event: PlantEvent;
  onEdit: (event: PlantEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const handleMenuOpen = (anchorEl: HTMLElement) => {
    setMenuAnchor(anchorEl);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    onEdit(event);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(event.id);
    handleMenuClose();
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">
              {new Date(event.timestamp).toLocaleDateString()} -{" "}
              {event.title}
            </Typography>
            <Chip label={event.type} size="small" sx={{ mb: 1 }} />
            {event.description && (
              <Typography variant="body2">
                {event.description}
              </Typography>
            )}
            {event.notes && (
              <Typography variant="body2" color="textSecondary">
                {event.notes}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <Edit sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <Delete sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;