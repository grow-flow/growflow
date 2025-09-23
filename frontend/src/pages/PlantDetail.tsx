import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import { usePlant, useCreateEvent, useUpdateEvent, useDeleteEvent } from "../hooks/usePlants";
import DynamicPlantTimeline from "../components/DynamicPlantTimeline";
import PlantHeader from "../components/PlantHeader";
import EventCard from "../components/EventCard";
import EventDialog from "../components/EventDialog";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const plantId = id ? parseInt(id) : 0;

  const { data: plant, isLoading, error } = usePlant(plantId);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [tabValue, setTabValue] = useState(0);
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: any | null }>({ open: false, event: null });
  const [eventData, setEventData] = useState({ 
    title: "", 
    notes: "", 
    timestamp: new Date().toISOString()
  });

  const handleCreateEvent = () => {
    setEventData({
      title: "Quick Watering",
      notes: "Quick watering logged from plant detail page",
      timestamp: new Date().toISOString()
    });
    setEventDialog({ open: true, event: null });
  };

  const handleEditEvent = (event: any) => {
    setEventData({ 
      title: event.title, 
      notes: event.notes || "",
      timestamp: event.timestamp
    });
    setEventDialog({ open: true, event });
  };

  const handleSaveEvent = async () => {
    if (!plant) return;

    try {
      if (eventDialog.event) {
        await updateEvent.mutateAsync({
          plantId: plant.id,
          eventId: eventDialog.event.id,
          eventData: eventData
        });
      } else {
        await createEvent.mutateAsync({
          plantId: plant.id,
          eventData: {
            type: "watering",
            title: eventData.title,
            notes: eventData.notes,
            timestamp: eventData.timestamp
          }
        });
      }
      setEventDialog({ open: false, event: null });
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!plant) return;

    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent.mutateAsync({
          plantId: plant.id,
          eventId
        });
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error loading plant</Typography>;
  if (!plant) return <Typography>Plant not found</Typography>;

  return (
    <Box>
      <PlantHeader plant={plant} onWaterClick={handleCreateEvent} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "fit-content" }}>
            <DynamicPlantTimeline plant={plant} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Events (${plant.events?.length || 0})`} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {plant.events?.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                  />
                )) || []}
                {(!plant.events || plant.events.length === 0) && (
                  <Typography color="textSecondary">
                    No events logged yet
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <EventDialog
        open={eventDialog.open}
        event={eventDialog.event}
        eventData={eventData}
        onClose={() => setEventDialog({ open: false, event: null })}
        onSave={handleSaveEvent}
        onChange={setEventData}
      />
    </Box>
  );
};

export default PlantDetail;