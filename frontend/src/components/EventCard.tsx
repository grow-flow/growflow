import React from "react";
import { Card, CardContent, Typography, Chip, Box, Divider } from "@mui/material";
import { PlantEvent } from "@/types/models";
import { getEventIcon, getEventColor } from "./EventDialog";
import PhotoGallery from "./PhotoGallery";

interface EventCardProps {
  event: PlantEvent;
  onEdit: (event: PlantEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const photos = event.data?.photos;
  const hasPhotos = photos && photos.length > 0;

  const metrics: { label: string; value: string }[] = [];
  const d = event.data;
  if (d?.amount_ml) metrics.push({ label: "ml", value: `${d.amount_ml}` });
  if (d?.ph_level) metrics.push({ label: "pH", value: `${d.ph_level}` });
  if (d?.ec_ppm) metrics.push({ label: "EC", value: `${d.ec_ppm}` });
  if (d?.training_method) metrics.push({ label: "Method", value: d.training_method });
  if (d?.wet_weight) metrics.push({ label: "Wet", value: `${d.wet_weight}g` });
  if (d?.dry_weight) metrics.push({ label: "Dry", value: `${d.dry_weight}g` });

  return (
    <Card
      variant="outlined"
      sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
      onClick={() => onEdit(event)}
    >
      {hasPhotos && <PhotoGallery photos={photos} variant="hero" />}

      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <span style={{ fontSize: "1.1em" }}>{getEventIcon(event.type)}</span>
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
            {event.title}
          </Typography>
          <Chip
            label={event.type}
            size="small"
            sx={{ backgroundColor: getEventColor(event.type), color: "white", fontSize: "0.7rem", height: 20 }}
          />
        </Box>

        <Typography variant="caption" color="textSecondary" display="block">
          {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>

        {metrics.length > 0 && (
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
            {metrics.map((m) => (
              <Box key={m.label}>
                <Typography variant="caption" color="textSecondary">{m.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{m.value}</Typography>
              </Box>
            ))}
          </Box>
        )}

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
