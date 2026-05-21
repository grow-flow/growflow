import React, { useMemo } from "react";
import { Paper, Box, Typography, Chip, Stack, CardActionArea, Divider } from "@mui/material";
import { LocalFlorist, WarningAmber } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { GrowArea, AreaEvent, Plant } from "../types/models";
import { AREA_TYPES } from "./CreateAreaDialog";
import { createPlantTimeline } from "../utils/PlantTimeline";
import { calculateVPD } from "../utils/vpd";
import { evaluatePlantHappiness } from "../utils/plantEnvironment";
import { getPhotoUrl } from "../services/api";

const getLatestPhoto = (plant: Plant): string | null => {
  const sorted = [...(plant.events || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  for (const e of sorted) if (e.data?.photos?.length) return getPhotoUrl(e.data.photos[0]);
  return null;
};

interface MetricProps {
  label: string;
  value: string;
}

const Metric: React.FC<MetricProps> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="textSecondary" sx={{ display: "block", lineHeight: 1 }}>
      {label}
    </Typography>
    <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.25 }}>
      {value}
    </Typography>
  </Box>
);

interface PlantRowProps {
  plant: Plant;
  area: GrowArea;
}

const PlantRow: React.FC<PlantRowProps> = ({ plant, area }) => {
  const navigate = useNavigate();
  const timeline = createPlantTimeline(plant.phases || [], plant.events || []);
  const info = timeline.flatTimeline.find((p) => p.isCurrent);
  const photoUrl = getLatestPhoto(plant);
  const currentPhaseName = info?.phase?.name;
  const happiness = useMemo(() => evaluatePlantHappiness(plant, area), [plant, area]);
  const showWarning = happiness.overall === "unhappy" || happiness.overall === "mostly-happy";

  return (
    <CardActionArea
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/plant/${plant.id}`);
      }}
      sx={{ borderRadius: 1.5, p: 0.75 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.25,
            bgcolor: "rgba(255,255,255,0.04)",
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            <LocalFlorist sx={{ fontSize: 18, color: "text.disabled" }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {plant.name}
            </Typography>
            {showWarning && (
              <WarningAmber
                sx={{
                  fontSize: 14,
                  color: happiness.overall === "unhappy" ? "error.main" : "warning.main",
                  flexShrink: 0,
                }}
                titleAccess={happiness.summary}
              />
            )}
          </Box>
          <Typography variant="caption" color="textSecondary" noWrap sx={{ display: "block" }}>
            {currentPhaseName || "—"} · Day {info?.daysElapsed ?? 0}
            {happiness.overall !== "unknown" && ` · ${happiness.summary}`}
          </Typography>
        </Box>
      </Box>
    </CardActionArea>
  );
};

export interface AreaCardProps {
  area: GrowArea;
  plants?: Plant[];
  /** Compact variant for overview grids: no plant list, plant-count only */
  compact?: boolean;
  /** Max plants shown in full variant */
  maxPlants?: number;
}

const AreaCard: React.FC<AreaCardProps> = ({ area, plants, compact = false, maxPlants = 4 }) => {
  const navigate = useNavigate();
  const icon = AREA_TYPES.find((t) => t.value === area.type)?.icon || "📦";
  const plantList = plants ?? area.plants ?? [];
  const plantCount = plants ? plants.length : area.plantCount ?? plantList.length;

  const latestEnv = (area.events || []).find((e: AreaEvent) => e.type === "environment");

  // Area-level VPD is just the raw sensor reading. Whether it's "good" depends
  // on which plant is asking — that judgement lives on each PlantRow below.
  const vpdValue = useMemo(() => {
    if (!latestEnv?.data) return null;
    const { temperature_c, humidity_percent } = latestEnv.data;
    return temperature_c !== undefined && humidity_percent !== undefined
      ? calculateVPD(temperature_c, humidity_percent)
      : null;
  }, [latestEnv]);

  const tempDisplay = latestEnv?.data?.temperature_c;
  const humidityDisplay = latestEnv?.data?.humidity_percent;

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        transition: "border-color 120ms ease, transform 120ms ease",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/area/${area.id}`)}
        sx={{ p: 2.25, borderRadius: 0 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: "rgba(76,175,80,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ lineHeight: 1.2 }}>
              {area.name}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ textTransform: "capitalize" }}
            >
              {area.type}
              {area.lightSchedule ? ` · 💡 ${area.lightSchedule}` : ""}
            </Typography>
          </Box>
          <Chip
            icon={<LocalFlorist sx={{ fontSize: 14 }} />}
            label={plantCount}
            size="small"
            variant="outlined"
          />
        </Box>

        {(tempDisplay !== undefined || humidityDisplay !== undefined || vpdValue !== null) && (
          <Stack direction="row" spacing={3} sx={{ mt: 2, px: 0.5 }}>
            {tempDisplay !== undefined && <Metric label="TEMP" value={`${tempDisplay}°C`} />}
            {humidityDisplay !== undefined && (
              <Metric label="HUMIDITY" value={`${humidityDisplay}%`} />
            )}
            {vpdValue !== null && <Metric label="VPD" value={`${vpdValue} kPa`} />}
          </Stack>
        )}

        {!latestEnv && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1.5, display: "block" }}>
            No environment data yet
          </Typography>
        )}
      </CardActionArea>

      {!compact && (
        <>
          <Divider sx={{ mx: 2.25 }} />
          <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.25, flex: 1 }}>
            {plantList.length === 0 ? (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No plants in this area
              </Typography>
            ) : (
              <>
                {plantList.slice(0, maxPlants).map((plant) => (
                  <PlantRow key={plant.id} plant={plant} area={area} />
                ))}
                {plantList.length > maxPlants && (
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ pl: 1, pt: 0.5, cursor: "pointer" }}
                    onClick={() => navigate(`/area/${area.id}`)}
                  >
                    +{plantList.length - maxPlants} more →
                  </Typography>
                )}
              </>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AreaCard;
