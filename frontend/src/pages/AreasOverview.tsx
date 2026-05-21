import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon, Yard as YardIcon } from "@mui/icons-material";
import { useAreas, useCreateArea } from "../hooks/useAreas";
import CreateAreaDialog from "../components/CreateAreaDialog";
import AreaCard from "../components/AreaCard";
import SectionHeader from "../components/SectionHeader";
import { CreateAreaRequest } from "../types/models";

const AreasOverview: React.FC = () => {
  const { data: areas = [], isLoading, error, refetch } = useAreas();
  const createArea = useCreateArea();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (data: CreateAreaRequest) => {
    await createArea.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

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
        Failed to load grow areas.
      </Alert>
    );
  }

  const activeAreas = areas.filter((a) => a.isActive);

  return (
    <Box>
      <SectionHeader title="Grow Areas" count={activeAreas.length}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Add Area
        </Button>
      </SectionHeader>

      {activeAreas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h1" sx={{ mb: 1.5 }}>
            ⛺
          </Typography>
          <Typography variant="h6" gutterBottom>
            No grow areas yet
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            Create an area to group plants and track environmental conditions
          </Typography>
          <Button
            variant="contained"
            startIcon={<YardIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create First Area
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {activeAreas.map((area) => (
            <Grid item xs={12} sm={6} md={4} key={area.id}>
              <AreaCard area={area} compact />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateAreaDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </Box>
  );
};

export default AreasOverview;
