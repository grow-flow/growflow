import React, { useState, useMemo } from "react";
import {
  Grid,
  Typography,
  Button,
  Box,
  Alert,
  Paper,
  Stack,
  Divider,
  CardActionArea,
} from "@mui/material";
import {
  LocalFlorist as PlantIcon,
  Yard as YardIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { usePlants, useCreatePlant } from "../hooks/usePlants";
import { useAreas, useCreateArea } from "../hooks/useAreas";
import { Plant, CreatePlantRequest, CreateAreaRequest } from "../types/models";
import CreatePlantDialog from "../components/CreatePlantDialog";
import CreateAreaDialog from "../components/CreateAreaDialog";
import AreaCard from "../components/AreaCard";
import SectionHeader from "../components/SectionHeader";
import { createPlantTimeline } from "../utils/PlantTimeline";
import { getPhotoUrl } from "../services/api";

const getLatestPhoto = (plant: Plant): string | null => {
  const sorted = [...(plant.events || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  for (const e of sorted) if (e.data?.photos?.length) return getPhotoUrl(e.data.photos[0]);
  return null;
};

interface StatProps {
  label: string;
  value: number | string;
  accent?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, accent }) => (
  <Box sx={{ px: { xs: 2, md: 3 }, py: 1.75, flex: 1, minWidth: 120 }}>
    <Typography
      variant="caption"
      color="textSecondary"
      sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}
    >
      {label}
    </Typography>
    <Typography variant="h4" sx={{ color: accent, mt: 0.25, lineHeight: 1.1 }}>
      {value}
    </Typography>
  </Box>
);

interface UnassignedPlantCardProps {
  plant: Plant;
  onClick: () => void;
}

const UnassignedPlantCard: React.FC<UnassignedPlantCardProps> = ({ plant, onClick }) => {
  const timeline = createPlantTimeline(plant.phases || [], plant.events || []);
  const info = timeline.flatTimeline.find((p) => p.isCurrent);
  const photoUrl = getLatestPhoto(plant);

  return (
    <CardActionArea onClick={onClick} sx={{ borderRadius: 1.5, p: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.25,
            bgcolor: "rgba(255,255,255,0.04)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {photoUrl ? (
            <Box
              component="img"
              src={photoUrl}
              alt={plant.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <PlantIcon sx={{ fontSize: 20, color: "text.disabled" }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {plant.name}
          </Typography>
          <Typography variant="caption" color="textSecondary" noWrap sx={{ display: "block" }}>
            {plant.strain?.name || "Unknown"} · {info?.phase?.name || "—"}
          </Typography>
        </Box>
      </Box>
    </CardActionArea>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);
  const [createAreaDialogOpen, setCreateAreaDialogOpen] = useState(false);

  const { data: allPlants = [], error, refetch } = usePlants();
  const { data: areas = [] } = useAreas();

  const createPlantMutation = useCreatePlant();
  const createAreaMutation = useCreateArea();

  const stats = useMemo(() => {
    const activePlants = allPlants.filter((p) => p.isActive);
    const activeAreas = areas.filter((a) => a.isActive);

    const totalGrowthDays = activePlants.reduce((sum, plant) => {
      const first = plant.phases?.[0];
      if (first?.startDate) {
        const start = new Date(first.startDate);
        return (
          sum +
          Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1
        );
      }
      return sum;
    }, 0);

    const plantsByArea = new Map<number, Plant[]>();
    for (const area of activeAreas) plantsByArea.set(area.id, []);
    const unassignedPlants: Plant[] = [];
    for (const plant of activePlants) {
      if (plant.areaId && plantsByArea.has(plant.areaId)) {
        plantsByArea.get(plant.areaId)!.push(plant);
      } else {
        unassignedPlants.push(plant);
      }
    }

    const flowering = activePlants.filter((p) => {
      const t = createPlantTimeline(p.phases || [], p.events || []);
      return /flower/i.test(t.currentPhase?.name || "");
    }).length;

    return {
      activePlants: activePlants.length,
      activeAreas: activeAreas.length,
      flowering,
      totalGrowthDays,
      plantsByArea,
      unassignedPlants,
      activeAreasList: activeAreas,
    };
  }, [allPlants, areas]);

  const handlePlantCreated = async (data: CreatePlantRequest) => {
    await createPlantMutation.mutateAsync(data);
    setCreatePlantDialogOpen(false);
  };

  const handleAreaCreated = async (data: CreateAreaRequest) => {
    await createAreaMutation.mutateAsync(data);
    setCreateAreaDialogOpen(false);
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Failed to load dashboard. Please try again.
      </Alert>
    );
  }

  const hasAreas = stats.activeAreasList.length > 0;
  const hasAnyPlants = allPlants.length > 0;

  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body2" color="textSecondary">
            {hasAreas
              ? `${stats.activeAreas} area${stats.activeAreas === 1 ? "" : "s"} · ${stats.activePlants} active plant${stats.activePlants === 1 ? "" : "s"}`
              : "Get started by creating your first grow area"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<YardIcon />}
            onClick={() => setCreateAreaDialogOpen(true)}
          >
            Add Area
          </Button>
          <Button
            variant="contained"
            startIcon={<PlantIcon />}
            onClick={() => setCreatePlantDialogOpen(true)}
          >
            Add Plant
          </Button>
        </Box>
      </Box>

      {/* Stat strip */}
      <Paper sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", sm: "block" } }}
            />
          }
        >
          <Stat label="Active Plants" value={stats.activePlants} accent="#4caf50" />
          <Stat label="Grow Areas" value={stats.activeAreas} accent="#ff9800" />
          <Stat label="Flowering" value={stats.flowering} accent="#ba68c8" />
          <Stat label="Growth Days" value={stats.totalGrowthDays} />
        </Stack>
      </Paper>

      {/* Grow Areas — primary content */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          title="Grow Areas"
          count={hasAreas ? stats.activeAreas : undefined}
          action={hasAreas ? { label: "View all", onClick: () => navigate("/areas") } : undefined}
        />

        {!hasAreas ? (
          <Paper sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h1" sx={{ mb: 1.5 }}>
              ⛺
            </Typography>
            <Typography variant="h6" gutterBottom>
              No grow areas yet
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 2.5 }}>
              Create an area to track environmental conditions and group your plants
            </Typography>
            <Button
              variant="contained"
              startIcon={<YardIcon />}
              onClick={() => setCreateAreaDialogOpen(true)}
            >
              Create Area
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {stats.activeAreasList.map((area) => (
              <Grid item xs={12} md={6} xl={4} key={area.id}>
                <AreaCard area={area} plants={stats.plantsByArea.get(area.id) || []} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Unassigned plants */}
      {stats.unassignedPlants.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            title="Unassigned Plants"
            count={stats.unassignedPlants.length}
            action={{ label: "View all plants", onClick: () => navigate("/plants") }}
          />
          <Paper sx={{ p: 1.5 }}>
            <Grid container spacing={0.5}>
              {stats.unassignedPlants.slice(0, 8).map((plant) => (
                <Grid item xs={12} sm={6} md={4} key={plant.id}>
                  <UnassignedPlantCard
                    plant={plant}
                    onClick={() => navigate(`/plant/${plant.id}`)}
                  />
                </Grid>
              ))}
            </Grid>
            {stats.unassignedPlants.length > 8 && (
              <Box sx={{ textAlign: "center", mt: 1 }}>
                <Button size="small" onClick={() => navigate("/plants")}>
                  +{stats.unassignedPlants.length - 8} more
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Empty plants state (areas exist, no plants) */}
      {hasAreas && !hasAnyPlants && (
        <Paper sx={{ p: 5, textAlign: "center" }}>
          <PlantIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No plants yet
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 2.5 }}>
            Add your first plant to start tracking growth
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreatePlantDialogOpen(true)}
          >
            Add Plant
          </Button>
        </Paper>
      )}

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
      />

      <CreateAreaDialog
        open={createAreaDialogOpen}
        onClose={() => setCreateAreaDialogOpen(false)}
        onSubmit={handleAreaCreated}
      />
    </Box>
  );
};

export default Dashboard;
