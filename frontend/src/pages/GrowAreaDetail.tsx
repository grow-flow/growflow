import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
} from "@mui/icons-material";
import { useGrowArea } from "../hooks/useGrowAreas";
import { useCreatePlant } from "../hooks/usePlants";
import { GrowArea, Plant } from "../types/models";
import CreatePlantDialog from "../components/CreatePlantDialog";
import SimplePlantList from "../components/SimplePlantList";

const GrowAreaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [createPlantDialogOpen, setCreatePlantDialogOpen] = useState(false);

  const growAreaId = id ? parseInt(id) : 0;
  const { data: growArea, isLoading, error, refetch } = useGrowArea(growAreaId);

  const createPlantMutation = useCreatePlant();

  const plants = growArea?.plants || [];


  const handlePlantCreated = async (plantData: Partial<Plant>) => {
    try {
      await createPlantMutation.mutateAsync(plantData);
      setCreatePlantDialogOpen(false);
    } catch (error) {
      console.error("Failed to create plant:", error);
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
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
        Failed to load grow area. Please try again.
      </Alert>
    );
  }

  if (!growArea) return <Typography>Grow area not found</Typography>;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">{growArea.name}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreatePlantDialogOpen(true)}
        >
          Add Plant
        </Button>
      </Box>

      {/* Simplified plant display */}
      <SimplePlantList plants={plants} />

      <Grid container spacing={3}>

        {/* Plants Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Plants in this Grow Area
            </Typography>

            {plants.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Strain</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Days in Phase</TableCell>
                      <TableCell>Last Watered</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plants.map((plant) => (
                      <TableRow key={plant.id}>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/plant/${plant.id}`}
                            variant="text"
                            sx={{ textTransform: "none", p: 0 }}
                          >
                            {plant.name}
                          </Button>
                        </TableCell>
                        <TableCell>{plant.strain}</TableCell>
                        <TableCell>
                          {plant.phases.find((p) => p.is_active)?.name ||
                            "Unknown"}
                        </TableCell>
                        <TableCell>12 days</TableCell>
                        <TableCell>2 days ago</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          >
                            Water
                          </Button>
                          <Button size="small" variant="outlined">
                            Feed
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="textSecondary" gutterBottom>
                  No plants in this grow area yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreatePlantDialogOpen(true)}
                >
                  Add First Plant
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Plant Data Columns */}
      {/* Plant data now shown in SimplePlantList above */}

      <CreatePlantDialog
        open={createPlantDialogOpen}
        onClose={() => setCreatePlantDialogOpen(false)}
        onSuccess={handlePlantCreated}
        growAreaId={growArea.id}
      />
    </Box>
  );
};

export default GrowAreaDetail;
