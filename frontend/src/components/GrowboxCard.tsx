import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, Thermostat as ThermostatIcon, Opacity as OpacityIcon } from '@mui/icons-material';
import { Growbox } from '../types/models';

interface GrowboxCardProps {
  growbox: Growbox;
}

const GrowboxCard: React.FC<GrowboxCardProps> = ({ growbox }) => {
  const plantCount = growbox.plants?.length || 0;
  const activePlants = growbox.plants?.filter(p => p.is_active).length || 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component={Link} to={`/growbox/${growbox.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
            {growbox.name}
          </Typography>
          <IconButton size="small">
            <SettingsIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={growbox.type} size="small" />
          <Chip label={`${activePlants}/${plantCount} plants`} size="small" color="primary" />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThermostatIcon fontSize="small" />
            <Typography variant="body2">--°C</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <OpacityIcon fontSize="small" />
            <Typography variant="body2">--%</Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="textSecondary">
          {growbox.dimensions.length} × {growbox.dimensions.width} × {growbox.dimensions.height} cm
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GrowboxCard;