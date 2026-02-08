import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Grid,
  Divider,
} from "@mui/material";
import { CameraAlt } from "@mui/icons-material";
import { PlantEvent } from "../types/models";
import { getEventIcon, getEventColor } from "../config/eventTypes";
import PhotoGallery from "./PhotoGallery";

interface EventCardProps {
  event: PlantEvent;
  onEdit: (event: PlantEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const photos = event.data?.photos;
  const hasPhotos = photos && photos.length > 0;

  const renderMetrics = () => {
    const data = event.data;
    if (!data) return null;

    const metrics: { label: string; value: string }[] = [];

    if (data.amount_ml) metrics.push({ label: 'Amount', value: `${data.amount_ml} ml` });
    if (data.ph_level) metrics.push({ label: 'pH', value: `${data.ph_level}` });
    if (data.ec_ppm) metrics.push({ label: 'EC', value: `${data.ec_ppm} PPM` });
    if (data.training_method) metrics.push({ label: 'Method', value: data.training_method });
    if (data.wet_weight) metrics.push({ label: 'Wet', value: `${data.wet_weight}g` });
    if (data.dry_weight) metrics.push({ label: 'Dry', value: `${data.dry_weight}g` });

    if (!metrics.length) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
        {metrics.map(m => (
          <Box key={m.label}>
            <Typography variant="caption" color="textSecondary">{m.label}</Typography>
            <Typography variant="body2" fontWeight={500}>{m.value}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
      onClick={() => onEdit(event)}
    >
      {/* Hero photo — full width at top when photos exist */}
      {hasPhotos && (
        <PhotoGallery photos={photos} variant="hero" />
      )}

      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <span style={{ fontSize: '1.1em' }}>{getEventIcon(event.type)}</span>
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>{event.title}</Typography>
          <Chip
            label={event.type}
            size="small"
            sx={{ backgroundColor: getEventColor(event.type), color: 'white', fontSize: '0.7rem', height: '20px' }}
          />
          {hasPhotos && !hasPhotos && (
            <CameraAlt sx={{ fontSize: 16, color: 'text.disabled' }} />
          )}
        </Box>

        <Typography variant="caption" color="textSecondary" display="block">
          {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>

        {renderMetrics()}

        {event.notes && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="textSecondary" fontStyle="italic">{event.notes}</Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
