import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Fab,
  Grid,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  LocalFlorist,
  SwapHoriz,
  FlashOn,
  WarningAmber,
} from "@mui/icons-material";
import {
  useArea,
  useUpdateArea,
  useDeleteArea,
  useCreateAreaEvent,
  useUpdateAreaEvent,
  useDeleteAreaEvent,
  useFlipArea,
} from "../hooks/useAreas";
import CreateAreaDialog, { AREA_TYPES, LIGHT_SCHEDULE_PRESETS } from "../components/CreateAreaDialog";
import EnvironmentEventDialog, { AREA_EVENT_META } from "../components/EnvironmentEventDialog";
import { AreaEvent, CreateAreaEventRequest, CreateAreaRequest, Plant } from "../types/models";
import { createPlantTimeline } from "../utils/PlantTimeline";
import { calculateVPD } from "../utils/vpd";
import { evaluatePlantHappiness } from "../utils/plantEnvironment";

const formatTimestamp = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
};

const formatDateHeader = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const AreaDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const areaId = id ? parseInt(id) : 0;

  const { data: area, isLoading, error } = useArea(areaId);
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();
  const createEvent = useCreateAreaEvent();
  const updateEvent = useUpdateAreaEvent();
  const deleteEvent = useDeleteAreaEvent();
  const flipArea = useFlipArea();

  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: AreaEvent | null }>({
    open: false,
    event: null,
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [flipDialog, setFlipDialog] = useState<{ open: boolean; newSchedule: string }>({
    open: false,
    newSchedule: "12/12",
  });
  const [transitionPlants, setTransitionPlants] = useState(true);

  const events: AreaEvent[] = area?.events || [];
  const plants: Plant[] = area?.plants || [];

  const latestEnv = useMemo(
    () => events.find((e) => e.type === "environment"),
    [events]
  );

  const eventsByDay = useMemo(() => {
    const groups = new Map<string, AreaEvent[]>();
    for (const event of events) {
      const key = formatDateHeader(event.timestamp);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return Array.from(groups.entries());
  }, [events]);

  // Area-level VPD: raw sensor reading. Per-plant judgement happens below in
  // the plants list via evaluatePlantHappiness.
  const vpdValue = useMemo(() => {
    if (!latestEnv?.data) return null;
    const { temperature_c, humidity_percent } = latestEnv.data;
    return temperature_c !== undefined && humidity_percent !== undefined
      ? calculateVPD(temperature_c, humidity_percent)
      : null;
  }, [latestEnv]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !area) {
    return <Alert severity="error">Failed to load area.</Alert>;
  }

  const typeIcon = AREA_TYPES.find((t) => t.value === area.type)?.icon || "📦";

  const handleUpdateArea = async (data: CreateAreaRequest) => {
    await updateArea.mutateAsync({ id: area.id, data });
  };

  const handleDeleteArea = async () => {
    if (!window.confirm(`Delete "${area.name}"? Plants will be unassigned but kept.`)) return;
    await deleteArea.mutateAsync(area.id);
    navigate("/areas");
  };

  const handleCreateEvent = async (data: CreateAreaEventRequest) => {
    await createEvent.mutateAsync({ areaId: area.id, data });
  };

  const handleUpdateEvent = async (data: CreateAreaEventRequest) => {
    if (!eventDialog.event) return;
    await updateEvent.mutateAsync({ areaId: area.id, eventId: eventDialog.event.id, data });
  };

  const handleDeleteEvent = async (eventId: number) => {
    await deleteEvent.mutateAsync({ areaId: area.id, eventId });
  };

  const handleFlip = async () => {
    await flipArea.mutateAsync({
      areaId: area.id,
      newSchedule: flipDialog.newSchedule,
      transitionPlants,
    });
    setFlipDialog({ open: false, newSchedule: "12/12" });
  };

  const isVegSchedule = area.lightSchedule && parseInt(area.lightSchedule.split("/")[0] || "0") >= 16;
  const photoperiodPlants = plants.filter((p) => !p.strain || p.strain.type === "photoperiod");

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.75,
              bgcolor: "rgba(76,175,80,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              flexShrink: 0,
            }}
          >
            {typeIcon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" noWrap>
              {area.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              <Chip label={area.type} size="small" sx={{ textTransform: "capitalize" }} />
              {area.lightSchedule && (
                <Chip label={`💡 ${area.lightSchedule}`} size="small" color="warning" variant="outlined" />
              )}
              <Chip
                icon={<LocalFlorist />}
                label={`${plants.length} plants`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isVegSchedule && photoperiodPlants.length > 0 && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<FlashOn />}
                onClick={() => setFlipDialog({ open: true, newSchedule: "12/12" })}
              >
                Flip to 12/12
              </Button>
            )}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
        {area.description && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1.5 }}>
            {area.description}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, mb: 2 }}>
            <Typography
              variant="overline"
              color="textSecondary"
              sx={{ display: "block", mb: 1 }}
            >
              Current Conditions
            </Typography>
            {latestEnv?.data ? (
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  {latestEnv.data.temperature_c !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Temperature
                      </Typography>
                      <Typography variant="h5">{latestEnv.data.temperature_c}°C</Typography>
                    </Grid>
                  )}
                  {latestEnv.data.humidity_percent !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Humidity
                      </Typography>
                      <Typography variant="h5">{latestEnv.data.humidity_percent}%</Typography>
                    </Grid>
                  )}
                  {vpdValue !== null && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        VPD
                      </Typography>
                      <Typography variant="h5">{vpdValue} kPa</Typography>
                    </Grid>
                  )}
                  {latestEnv.data.co2_ppm !== undefined && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        CO₂
                      </Typography>
                      <Typography variant="h5">{latestEnv.data.co2_ppm} ppm</Typography>
                    </Grid>
                  )}
                </Grid>
                <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1.5 }}>
                  Last updated: {formatTimestamp(latestEnv.timestamp)} ({latestEnv.source})
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                No environment data yet. Log your first reading →
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography
              variant="overline"
              color="textSecondary"
              sx={{ display: "block", mb: 1 }}
            >
              Plants in Area ({plants.length})
            </Typography>
            {plants.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                No plants assigned. Assign plants from their detail page.
              </Typography>
            ) : (
              <List dense sx={{ mt: 0.5 }}>
                {plants.map((plant) => {
                  const timeline = createPlantTimeline(plant.phases || [], plant.events || []);
                  const currentPhaseName = timeline.currentPhase?.name;
                  const happiness = evaluatePlantHappiness(plant, area);
                  const unhappy = happiness.overall === "unhappy";
                  const warn = happiness.overall === "mostly-happy";
                  return (
                    <ListItemButton
                      key={plant.id}
                      onClick={() => navigate(`/plant/${plant.id}`)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <span>{plant.name}</span>
                            {(unhappy || warn) && (
                              <Tooltip title={happiness.summary}>
                                <WarningAmber sx={{ fontSize: 14, color: unhappy ? "error.main" : "warning.main" }} />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={`${plant.strain?.name || "No strain"} · ${currentPhaseName || "—"}${happiness.overall !== "unknown" ? ` · ${happiness.summary}` : ""}`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Main content: Environment Log */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Environment Log</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setEventDialog({ open: true, event: null })}
              >
                Log Event
              </Button>
            </Box>

            {events.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
                  No events logged yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Log light schedule changes, environment readings, or equipment changes
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {eventsByDay.map(([day, dayEvents]) => (
                  <Box key={day}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ textTransform: "uppercase", fontWeight: 600 }}
                    >
                      {day}
                    </Typography>
                    <Divider sx={{ mb: 1, mt: 0.5 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {dayEvents.map((event) => {
                        const meta = AREA_EVENT_META[event.type];
                        return (
                          <Box
                            key={event.id}
                            onClick={() => setEventDialog({ open: true, event })}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 1.5,
                              cursor: "pointer",
                              border: "1px solid",
                              borderColor: "divider",
                              transition: "border-color 120ms ease, background-color 120ms ease",
                              "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: "rgba(76,175,80,0.04)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: `${meta.color}22`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.1rem",
                                flexShrink: 0,
                              }}
                            >
                              {meta.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                <Typography variant="subtitle2">{event.title}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(event.timestamp).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Typography>
                                {event.source !== "manual" && (
                                  <Chip label={event.source} size="small" variant="outlined" />
                                )}
                              </Box>
                              {event.notes && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                  {event.notes}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* FAB */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setEventDialog({ open: true, event: null })}
      >
        <Add />
      </Fab>

      {/* Menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setEditDialogOpen(true);
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Area
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setFlipDialog({ open: true, newSchedule: area.lightSchedule === "12/12" ? "18/6" : "12/12" });
          }}
        >
          <SwapHoriz fontSize="small" sx={{ mr: 1 }} />
          Change Light Schedule
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            handleDeleteArea();
          }}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Area
        </MenuItem>
      </Menu>

      <CreateAreaDialog
        open={editDialogOpen}
        area={area}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateArea}
      />

      <EnvironmentEventDialog
        open={eventDialog.open}
        event={eventDialog.event}
        onClose={() => setEventDialog({ open: false, event: null })}
        onSubmit={eventDialog.event ? handleUpdateEvent : handleCreateEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Flip Dialog */}
      <Dialog open={flipDialog.open} onClose={() => setFlipDialog({ ...flipDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Change Light Schedule</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Current: {area.lightSchedule || "not set"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {LIGHT_SCHEDULE_PRESETS.map((preset) => (
              <Button
                key={preset}
                size="small"
                variant={flipDialog.newSchedule === preset ? "contained" : "outlined"}
                onClick={() => setFlipDialog({ ...flipDialog, newSchedule: preset })}
              >
                {preset}
              </Button>
            ))}
          </Box>
          {photoperiodPlants.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={transitionPlants}
                    onChange={(e) => setTransitionPlants(e.target.checked)}
                  />
                }
                label={`Transition ${photoperiodPlants.length} photoperiod plant(s) to next phase`}
              />
              {transitionPlants && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  All photoperiod plants in this area will advance to their next phase (typically Vegetation → Flowering).
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlipDialog({ ...flipDialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFlip}
            disabled={!flipDialog.newSchedule || flipArea.isPending}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AreaDetail;
