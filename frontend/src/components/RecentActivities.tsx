import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Box } from '@mui/material';
import { Opacity, Restaurant, Visibility, LocalFlorist } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const RecentActivities: React.FC = () => {
  // Mock recent activities
  const activities = [
    {
      id: 1,
      type: 'watering',
      plant: 'White Widow #1',
      plantId: 1,
      time: '2 hours ago',
      icon: <Opacity color="primary" />
    },
    {
      id: 2,
      type: 'feeding',
      plant: 'Northern Lights #2',
      plantId: 2,
      time: '4 hours ago',
      icon: <Restaurant color="secondary" />
    },
    {
      id: 3,
      type: 'observation',
      plant: 'Sour Diesel #1',
      plantId: 3,
      time: '1 day ago',
      icon: <Visibility color="action" />
    },
    {
      id: 4,
      type: 'phase_change',
      plant: 'Blue Dream #3',
      plantId: 4,
      time: '2 days ago',
      icon: <LocalFlorist color="success" />
    }
  ];

  const getActivityText = (activity: typeof activities[0]) => {
    switch (activity.type) {
      case 'watering':
        return `Watered ${activity.plant}`;
      case 'feeding':
        return `Fed ${activity.plant}`;
      case 'observation':
        return `Observed ${activity.plant}`;
      case 'phase_change':
        return `${activity.plant} entered flowering`;
      default:
        return activity.plant;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities
      </Typography>
      
      {activities.length > 0 ? (
        <List>
          {activities.map((activity) => (
            <ListItem
              key={activity.id}
              component={Link}
              to={`/plant/${activity.plantId}`}
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit',
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 1
              }}
            >
              <ListItemIcon>
                {activity.icon}
              </ListItemIcon>
              <ListItemText
                primary={getActivityText(activity)}
                secondary={activity.time}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No recent activities
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivities;