import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Typography, Paper, Box, Tabs, Tab, Chip, Fab, Button } from "@mui/material";
import { Add, Download } from "@mui/icons-material";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { usePlant, useCreateEvent, useUpdateEvent, useDeleteEvent, useUpdatePlant } from "@/hooks/usePlants";
import { Plant, PlantEvent, PlantPhase } from "@/types/models";
import { apiService, getPhotoUrl } from "@/services/api";
import DynamicPlantTimeline from "@/components/DynamicPlantTimeline";
import PlantHeader from "@/components/PlantHeader";
import EventCard from "@/components/EventCard";
import EventDialog, { EVENT_META, EventFormData } from "@/components/EventDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import PhotoGallery from "@/components/PhotoGallery";

const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>
);

interface PhaseGroup {
  phase: PlantPhase;
  events: PlantEvent[];
}

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
  const [downloading, setDownloading] = useState(false);
  const [eventData, setEventData] = useState<EventFormData>({
    type: "watering",
    title: "Watering",
    notes: "",
    timestamp: new Date().toISOString(),
    data: {},
  });

  const eventsByPhase = useMemo((): PhaseGroup[] => {
    if (!plant) return [];
    const startedPhases = plant.phases
      .filter((p) => p.startDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    return startedPhases
      .map((phase, i) => {
        const start = new Date(phase.startDate!).getTime();
        const end = i < startedPhases.length - 1 ? new Date(startedPhases[i + 1].startDate!).getTime() : Infinity;
        const events = (plant.events || [])
          .filter((e) => {
            const t = new Date(e.timestamp).getTime();
            return t >= start && t < end;
          })
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return { phase, events };
      })
      .reverse();
  }, [plant]);

  const galleryByPhase = useMemo(
    () =>
      [...eventsByPhase]
        .reverse()
        .map((g) => ({
          name: g.phase?.name || "Other",
          startDate: g.phase?.startDate,
          photos: g.events.flatMap((e) => e.data?.photos || []),
        }))
        .filter((g) => g.photos.length > 0),
    [eventsByPhase]
  );

  const totalPhotos = galleryByPhase.reduce((sum, g) => sum + g.photos.length, 0);
  const allPhotos = galleryByPhase.flatMap((g) => g.photos);

  const handleDownloadPhotos = async () => {
    if (!plant || allPhotos.length === 0) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        allPhotos.map(async (filename) => {
          const res = await fetch(getPhotoUrl(filename));
          const blob = await res.blob();
          zip.file(filename.split("/").pop()!, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${plant.name}-photos.zip`);
    } catch (err) {
      console.error("Failed to download photos:", err);
    } finally {
      setDownloading(false);
    }
  };

  const openEventDialog = (type: PlantEvent["type"]) => {
    const meta = EVENT_META[type];
    setEventData({
      type,
      title: meta?.label || type,
      notes: "",
      timestamp: new Date().toISOString(),
      data: {},
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
      data: event.data || {},
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
    } catch (err) {
      console.error("Failed to save event:", err);
    }
  };

  const handlePhotoRemove = (photo: string) => {
    const photos = (eventData.data?.photos || []).filter((p) => p !== photo);
    setEventData({ ...eventData, data: { ...eventData.data, photos } });
    apiService.deletePhoto(photo).catch(() => {});
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!plant) return;
    try {
      await deleteEvent.mutateAsync({ plantId: plant.id, eventId });
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleSavePlant = async (data: Partial<Plant>) => {
    if (!plant) return;
    try {
      await updatePlant.mutateAsync({ id: plant.id, data });
    } catch (err) {
      console.error("Failed to update plant:", err);
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error loading plant</Typography>;
  if (!plant) return <Typography>Plant not found</Typography>;

  return (
    <Box>
      <PlantHeader plant={plant} onEditClick={() => setEditPlantDialog(true)} />

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        <Box sx={{ width: { xs: "100%", md: 340 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3 }}>
            <DynamicPlantTimeline plant={plant} />
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Journal (${plant.events?.length || 0})`} />
              <Tab label={`Gallery (${totalPhotos})`} disabled={totalPhotos === 0} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {eventsByPhase.length === 0 ? (
                <Typography color="textSecondary">No events logged yet</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {eventsByPhase.map((group) => (
                    <Box key={group.phase.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Typography variant="overline" fontWeight={600} sx={{ letterSpacing: 1.5, color: "text.secondary" }}>
                          {group.phase.name}
                        </Typography>
                        {group.phase.startDate && (
                          <Typography variant="caption" color="textSecondary">
                            — {new Date(group.phase.startDate).toLocaleDateString()}
                          </Typography>
                        )}
                        <Chip label={group.events.length} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                      </Box>
                      {group.events.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" sx={{ pl: 0.5 }}>No events in this phase</Typography>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                          {group.events.map((event) => (
                            <EventCard key={event.id} event={event} onEdit={handleEditEvent} />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadPhotos}
                  disabled={allPhotos.length === 0 || downloading}
                >
                  {downloading ? "Zipping…" : "Download All Photos"}
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {galleryByPhase.map((group) => (
                  <Box key={group.name}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography variant="overline" fontWeight={600} sx={{ letterSpacing: 1.5, color: "text.secondary" }}>
                        {group.name}
                      </Typography>
                      {group.startDate && (
                        <Typography variant="caption" color="textSecondary">
                          — {new Date(group.startDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                    <PhotoGallery photos={group.photos} variant="grid" thumbSize={140} />
                  </Box>
                ))}
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>

      <Fab
        color="primary"
        onClick={() => openEventDialog("watering")}
        sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1200 }}
      >
        <Add />
      </Fab>

      <EventDialog
        open={eventDialog.open}
        event={eventDialog.event}
        eventData={eventData}
        pendingFiles={pendingFiles}
        onClose={() => { setEventDialog({ open: false, event: null }); setPendingFiles([]); }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onChange={setEventData}
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
