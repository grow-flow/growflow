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
import { usePlant, useCreateEvent, useUpdateEvent, useDeleteEvent, useUpdatePlant } from "../hooks/usePlants";
import { PlantEvent } from "../types/models";
import DynamicPlantTimeline from "../components/DynamicPlantTimeline";
import PlantHeader from "../components/PlantHeader";
import EventCard from "../components/EventCard";
import EventDialog from "../components/EventDialog";
import EditPlantDialog from "../components/EditPlantDialog";

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
  const updatePlant = useUpdatePlant();

  const [tabValue, setTabValue] = useState(0);
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: any | null }>({ open: false, event: null });
  const [editPlantDialog, setEditPlantDialog] = useState(false);
  const [eventData, setEventData] = useState<{
    type: PlantEvent['type'];
    title: string;
    notes: string;
    timestamp: string;
    data?: PlantEvent['data'];
  }>({ 
    type: "watering" as PlantEvent['type'],
    title: "Watering", 
    notes: "", 
    timestamp: new Date().toISOString(),
    data: {}
  });

  const handleCreateEvent = () => {
    setEventData({
      type: "watering" as PlantEvent['type'],
      title: "Quick Watering",
      notes: "Quick watering logged from plant detail page",
      timestamp: new Date().toISOString(),
      data: {}
    });
    setEventDialog({ open: true, event: null });
  };

  const handleEditEvent = (event: any) => {
    setEventData({ 
      type: event.type || "watering",
      title: event.title, 
      notes: event.notes || "",
      timestamp: event.timestamp,
      data: event.data || {}
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
            type: eventData.type,
            title: eventData.title,
            notes: eventData.notes,
            timestamp: eventData.timestamp,
            data: eventData.data
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

    try {
      await deleteEvent.mutateAsync({
        plantId: plant.id,
        eventId
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleSavePlant = async (data: any) => {
    if (!plant) return;

    try {
      await updatePlant.mutateAsync({
        id: plant.id,
        data
      });
    } catch (error) {
      console.error("Failed to update plant:", error);
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error loading plant</Typography>;
  if (!plant) return <Typography>Plant not found</Typography>;

  return (
    <Box>
      <PlantHeader
        plant={plant}
        onWaterClick={handleCreateEvent}
        onEditClick={() => setEditPlantDialog(true)}
      />

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
        onDelete={handleDeleteEvent}
        onChange={(data) => setEventData(data)}
      />

      <EditPlantDialog
        open={editPlantDialog}
        plant={plant}
        onClose={() => setEditPlantDialog(false)}
        onSave={handleSavePlant}
      />
    </Box>
  );
};

export default PlantDetail;