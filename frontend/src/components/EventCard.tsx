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
import { PlantEvent } from "../types/models";
import { getEventIcon, getEventColor } from "../config/eventTypes";

interface EventCardProps {
  event: PlantEvent;
  onEdit: (event: PlantEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const renderEventData = () => {
    const data = event.data;
    if (!data) return null;

    switch (event.type) {
      case 'watering':
        return (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {data.amount_ml && (
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="textSecondary">Amount</Typography>
                <Typography variant="body2" fontWeight={500}>{data.amount_ml} ml</Typography>
              </Grid>
            )}
            {data.ph_level && (
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="textSecondary">pH</Typography>
                <Typography variant="body2" fontWeight={500}>{data.ph_level}</Typography>
              </Grid>
            )}
            {data.ec_ppm && (
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="textSecondary">EC</Typography>
                <Typography variant="body2" fontWeight={500}>{data.ec_ppm} PPM</Typography>
              </Grid>
            )}
          </Grid>
        );

      case 'training':
        return data.training_method && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="textSecondary">Method</Typography>
            <Typography variant="body2" fontWeight={500}>{data.training_method}</Typography>
          </Box>
        );

      case 'harvest':
        return (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {data.wet_weight && (
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Wet Weight</Typography>
                <Typography variant="body2" fontWeight={500}>{data.wet_weight}g</Typography>
              </Grid>
            )}
            {data.dry_weight && (
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Dry Weight</Typography>
                <Typography variant="body2" fontWeight={500}>{data.dry_weight}g</Typography>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
      onClick={() => onEdit(event)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <span style={{ fontSize: '1.2em' }}>{getEventIcon(event.type)}</span>
          <Typography variant="subtitle2" fontWeight={600}>{event.title}</Typography>
          <Chip
            label={event.type}
            size="small"
            sx={{ backgroundColor: getEventColor(event.type), color: 'white', fontSize: '0.7rem', height: '20px' }}
          />
        </Box>

        <Typography variant="caption" color="textSecondary" display="block">
          {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>

        {renderEventData()}

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
