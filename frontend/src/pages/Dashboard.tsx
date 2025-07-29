import React, { useEffect, useState } from 'react';
import { Grid, Typography, Card, CardContent, Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Growbox } from '../types/models';
import GrowboxCard from '../components/GrowboxCard';

const Dashboard: React.FC = () => {
  const [growboxes, setGrowboxes] = useState<Growbox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrowboxes = async () => {
      try {
        const data = await apiService.getGrowboxes();
        setGrowboxes(data);
      } catch (error) {
        console.error('Failed to fetch growboxes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowboxes();
  }, []);

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: 2 }}
        >
          New Growbox
        </Button>
      </Box>

      <Grid container spacing={3}>
        {growboxes.map((growbox) => (
          <Grid item xs={12} md={6} lg={4} key={growbox.id}>
            <GrowboxCard growbox={growbox} />
          </Grid>
        ))}
        
        {growboxes.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No growboxes yet
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 3 }}>
                  Create your first growbox to start tracking your plants
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Create Growbox
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;