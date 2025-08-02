import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LocalFlorist as EcoIcon, ArrowBack as BackIcon } from '@mui/icons-material';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const showBackButton = location.pathname !== '/plants' && location.pathname !== '/strains';

  return (
    <AppBar position="sticky">
      <Toolbar>
        {showBackButton && (
          <IconButton
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 1, color: 'white' }}
          >
            <BackIcon />
          </IconButton>
        )}
        <EcoIcon sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GrowFlow
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/plants"
            sx={{ opacity: location.pathname === '/plants' ? 1 : 0.7 }}
          >
            Plants
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/strains"
            sx={{ opacity: location.pathname === '/strains' ? 1 : 0.7 }}
          >
            Strains
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;