import React, { useState, useMemo } from "react";
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
import { Plant, PlantEvent } from "../types/models";
import { apiService } from "../services/api";
import DynamicPlantTimeline from "../components/DynamicPlantTimeline";
import PlantHeader from "../components/PlantHeader";
import EventCard from "../components/EventCard";
import EventDialog from "../components/EventDialog";
import EditPlantDialog from "../components/EditPlantDialog";
import PhotoGallery from "../components/PhotoGallery";

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
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: PlantEvent | null }>({ open: false, event: null });
  const [editPlantDialog, setEditPlantDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [eventData, setEventData] = useState<{
    type: PlantEvent['type'];
    title: string;
    notes: string;
    timestamp: string;
    data?: PlantEvent['data'];
  }>({
    type: "watering",
    title: "Watering",
    notes: "",
    timestamp: new Date().toISOString(),
    data: {}
  });

  const galleryByPhase = useMemo(() => {
    if (!plant) return [];
    const phaseMap = new Map<number, { name: string; startDate?: string; photos: string[] }>();
    const noPhase: string[] = [];

    plant.phases.forEach(p => phaseMap.set(p.id, { name: p.name, startDate: p.startDate, photos: [] }));

    plant.events?.forEach(e => {
      const photos = e.data?.photos;
      if (!photos?.length) return;
      if (e.phaseId && phaseMap.has(e.phaseId)) {
        phaseMap.get(e.phaseId)!.photos.push(...photos);
      } else {
        noPhase.push(...photos);
      }
    });

    const result = [...phaseMap.values()].filter(p => p.photos.length > 0);
    if (noPhase.length) result.push({ name: 'Other', photos: noPhase });
    return result;
  }, [plant]);

  const totalPhotos = useMemo(() =>
    galleryByPhase.reduce((sum, p) => sum + p.photos.length, 0),
    [galleryByPhase]
  );

  const handleCreateEvent = () => {
    setEventData({
      type: "watering",
      title: "Quick Watering",
      notes: "Quick watering logged from plant detail page",
      timestamp: new Date().toISOString(),
      data: {}
    });
    setPendingFiles([]);
    setEventDialog({ open: true, event: null });
  };

  const handleEditEvent = (event: PlantEvent) => {
    setEventData({
      type: event.type,
      title: event.title,
      notes: event.notes || "",
      timestamp: event.timestamp,
      data: event.data || {}
    });
    setPendingFiles([]);
    setEventDialog({ open: true, event });
  };

  const handleSaveEvent = async () => {
    if (!plant) return;

    try {
      let photos = eventData.data?.photos || [];

      if (pendingFiles.length > 0) {
        const uploaded = await apiService.uploadPhotos(plant.id, pendingFiles);
        photos = [...photos, ...uploaded];
      }

      const dataWithPhotos = { ...eventData.data, photos: photos.length ? photos : undefined };
      const payload = { ...eventData, data: dataWithPhotos };

      if (eventDialog.event) {
        await updateEvent.mutateAsync({ plantId: plant.id, eventId: eventDialog.event.id, eventData: payload });
      } else {
        await createEvent.mutateAsync({ plantId: plant.id, eventData: payload });
      }

      setPendingFiles([]);
      setEventDialog({ open: false, event: null });
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handlePhotoRemove = (photo: string) => {
    const photos = (eventData.data?.photos || []).filter(p => p !== photo);
    setEventData({ ...eventData, data: { ...eventData.data, photos } });
    apiService.deletePhoto(photo).catch(() => {});
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!plant) return;
    try {
      await deleteEvent.mutateAsync({ plantId: plant.id, eventId });
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleSavePlant = async (data: Partial<Plant>) => {
    if (!plant) return;
    try {
      await updatePlant.mutateAsync({ id: plant.id, data });
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
              <Tab label={`Gallery (${totalPhotos})`} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {plant.events?.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={handleEditEvent} />
                )) || []}
                {(!plant.events || plant.events.length === 0) && (
                  <Typography color="textSecondary">No events logged yet</Typography>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {galleryByPhase.length === 0 ? (
                <Typography color="textSecondary">
                  No photos yet — add photos when logging events
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {galleryByPhase.map((phase) => (
                    <Box key={phase.name}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        {phase.name}
                        {phase.startDate && (
                          <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                            {new Date(phase.startDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Typography>
                      <PhotoGallery photos={phase.photos} thumbSize={100} />
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <EventDialog
        open={eventDialog.open}
        event={eventDialog.event}
        eventData={eventData}
        pendingFiles={pendingFiles}
        onClose={() => { setEventDialog({ open: false, event: null }); setPendingFiles([]); }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onChange={(data) => setEventData(data)}
        onFilesChange={setPendingFiles}
        onPhotoRemove={handlePhotoRemove}
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
