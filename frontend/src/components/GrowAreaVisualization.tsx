import React from 'react';
import { Box, Paper, Typography, Chip, Grid } from '@mui/material';
import { GrowArea, Plant } from '../types/models';

interface GrowAreaVisualizationProps {
  growArea: GrowArea;
  plants: Plant[];
}

const GrowAreaVisualization: React.FC<GrowAreaVisualizationProps> = ({ growArea, plants }) => {
  const { dimensions } = growArea;
  const activePlants = plants.filter(p => p.is_active);
  
  // Calculate plant positions in a grid layout
  const getPlantPositions = () => {
    const cols = Math.ceil(Math.sqrt(activePlants.length));
    const rows = Math.ceil(activePlants.length / cols);
    
    return activePlants.map((plant, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      return {
        plant,
        x: (col + 0.5) * (100 / cols),
        y: (row + 0.5) * (100 / rows),
      };
    });
  };

  const plantPositions = getPlantPositions();

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'germination': return '#8BC34A';
      case 'seedling': return '#4CAF50';
      case 'vegetation': return '#2E7D32';
      case 'pre_flower': return '#FF9800';
      case 'flowering': return '#E91E63';
      case 'flushing': return '#9C27B0';
      case 'harvest': return '#795548';
      default: return '#4CAF50';
    }
  };

  const getPlantSize = (phase: string) => {
    switch (phase) {
      case 'germination': return 8;
      case 'seedling': return 12;
      case 'vegetation': return 20;
      case 'pre_flower': return 24;
      case 'flowering': return 28;
      case 'flushing': return 28;
      case 'harvest': return 24;
      default: return 16;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {growArea.name} Visualization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* 3D-ish Growbox Visualization */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 400,
              backgroundColor: '#1a1a1a',
              border: '2px solid #333',
              borderRadius: 2,
              overflow: 'hidden',
              background: `
                linear-gradient(135deg, 
                  rgba(76, 175, 80, 0.1) 0%, 
                  rgba(33, 150, 243, 0.05) 50%, 
                  rgba(0, 0, 0, 0.3) 100%
                )
              `,
            }}
          >
            {/* Grow Area Floor Grid */}
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#333" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>

            {/* Plants */}
            {plantPositions.map(({ plant, x, y }) => (
              <Box
                key={plant.id}
                sx={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translate(-50%, -50%) scale(1.2)',
                  }
                }}
              >
                {/* Plant Pot */}
                <Box
                  sx={{
                    width: getPlantSize(plant.current_phase),
                    height: getPlantSize(plant.current_phase) * 0.6,
                    backgroundColor: '#8D6E63',
                    borderRadius: '0 0 50% 50%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  {/* Plant */}
                  <Box
                    sx={{
                      width: getPlantSize(plant.current_phase) * 0.8,
                      height: getPlantSize(plant.current_phase) * 1.2,
                      backgroundColor: getPhaseColor(plant.current_phase),
                      borderRadius: '50% 50% 10% 10%',
                      position: 'absolute',
                      bottom: getPlantSize(plant.current_phase) * 0.3,
                      boxShadow: `0 2px 8px ${getPhaseColor(plant.current_phase)}40`,
                    }}
                  />
                  
                  {/* Plant Name Label */}
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: -20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: 'white',
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      px: 0.5,
                      borderRadius: 0.5,
                    }}
                  >
                    {plant.name}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Lighting Effect */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30%',
                background: 'linear-gradient(180deg, rgba(255,255,0,0.1) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Growbox Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Dimensions
            </Typography>
            <Typography variant="body1">
              {dimensions.length} × {dimensions.width} × {dimensions.height} cm
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Type
            </Typography>
            <Chip label={growArea.type} size="small" />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Plants
            </Typography>
            <Typography variant="body1">
              {activePlants.length} active plants
            </Typography>
          </Box>

          {/* Plant Legend */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Plant Phases
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from(new Set(activePlants.map(p => p.current_phase))).map(phase => (
                <Box key={phase} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: getPhaseColor(phase),
                      borderRadius: '50%',
                    }}
                  />
                  <Typography variant="caption">
                    {phase} ({activePlants.filter(p => p.current_phase === phase).length})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GrowAreaVisualization;