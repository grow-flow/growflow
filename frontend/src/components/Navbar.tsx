import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { LocalFlorist as EcoIcon } from '@mui/icons-material';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <AppBar position="sticky">
      <Toolbar>
        <EcoIcon sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GrowFlow
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            sx={{ opacity: location.pathname === '/' ? 1 : 0.7 }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/settings"
            sx={{ opacity: location.pathname === '/settings' ? 1 : 0.7 }}
          >
            Settings
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;