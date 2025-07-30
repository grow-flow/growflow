import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Thermostat as ThermostatIcon, Opacity as OpacityIcon, Circle as CircleIcon } from '@mui/icons-material';
import { GrowArea } from '../types/models';

interface GrowAreaCardProps {
  growArea: GrowArea;
}

const GrowAreaCard: React.FC<GrowAreaCardProps> = ({ growArea }) => {
  const [envData, setEnvData] = useState<{ temperature: number | null; humidity: number | null; vpd: number | null }>({ 
    temperature: null, 
    humidity: null, 
    vpd: null 
  });
  const [status, setStatus] = useState<'good' | 'warning' | 'error'>('good');
  
  const plantCount = growArea.plants?.length || 0;
  const activePlants = growArea.plants?.filter(p => p.is_active).length || 0;
  
  // Mock live data - in real app würde das von WebSocket oder API kommen
  useEffect(() => {
    const interval = setInterval(() => {
      const temp = 22 + Math.random() * 6; // 22-28°C
      const humidity = 45 + Math.random() * 20; // 45-65%
      const vpd = 0.8 + Math.random() * 0.8; // 0.8-1.6 kPa
      
      setEnvData({ temperature: temp, humidity, vpd });
      
      // Status based on VPD ranges
      if (vpd < 0.4 || vpd > 1.6) setStatus('error');
      else if (vpd < 0.6 || vpd > 1.4) setStatus('warning');
      else setStatus('good');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'good': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#757575';
    }
  };

  const getNextAction = () => {
    if (!activePlants) return 'Add plants';
    if (Math.random() > 0.5) return 'Water in 2h';
    return 'Check in 4h';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircleIcon sx={{ fontSize: 12, color: getStatusColor() }} />
            <Typography variant="h6" component={Link} to={`/grow-area/${growArea.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
              {growArea.name}
            </Typography>
          </Box>
          <IconButton size="small">
            <SettingsIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={growArea.type} size="small" />
          <Chip label={`${activePlants}/${plantCount} plants`} size="small" color="primary" />
          <Chip label={status} size="small" color={status === 'good' ? 'success' : status === 'warning' ? 'warning' : 'error'} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThermostatIcon fontSize="small" />
            <Typography variant="body2">
              {envData.temperature !== null ? `${envData.temperature.toFixed(1)}°C` : '--°C'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <OpacityIcon fontSize="small" />
            <Typography variant="body2">
              {envData.humidity !== null ? `${envData.humidity.toFixed(0)}%` : '--%'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              VPD: {envData.vpd !== null ? `${envData.vpd.toFixed(2)}` : '--'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Next: {getNextAction()}
          </Typography>
        </Box>

        <Typography variant="body2" color="textSecondary">
          {growArea.dimensions.length} × {growArea.dimensions.width} × {growArea.dimensions.height} cm
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GrowAreaCard;