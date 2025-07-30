import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { LocalFlorist, Thermostat, Opacity, Schedule } from '@mui/icons-material';
import { GrowArea } from '../types/models';

interface QuickStatsProps {
  growAreas: GrowArea[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ growAreas }) => {
  const totalPlants = growAreas.reduce((sum, area) => sum + (area.plants?.length || 0), 0);
  const activePlants = growAreas.reduce((sum, area) => 
    sum + (area.plants?.filter(p => p.is_active).length || 0), 0
  );
  const activeGrowAreas = growAreas.length;
  const avgTemp = 24.5; // Mock data
  const avgHumidity = 58; // Mock data

  const stats = [
    {
      title: 'Active Plants',
      value: `${activePlants}/${totalPlants}`,
      icon: <LocalFlorist />,
      color: '#4caf50'
    },
    {
      title: 'Grow Areas',
      value: activeGrowAreas,
      icon: <Schedule />,
      color: '#2196f3'
    },
    {
      title: 'Avg Temperature',
      value: `${avgTemp}°C`,
      icon: <Thermostat />,
      color: '#ff9800'
    },
    {
      title: 'Avg Humidity',
      value: `${avgHumidity}%`,
      icon: <Opacity />,
      color: '#00bcd4'
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={6} md={3} key={index}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ color: stat.color }}>
              {stat.icon}
            </Box>
            <Box>
              <Typography variant="h6">{stat.value}</Typography>
              <Typography variant="caption" color="textSecondary">
                {stat.title}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default QuickStats;