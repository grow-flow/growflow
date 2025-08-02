import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { format, addDays, differenceInDays } from 'date-fns';

interface TimelinePhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCompleted: boolean;
  isFuture: boolean;
}

interface PlantTimelineChartProps {
  // For now we'll use mock data, later we'll accept real plant data
  mockData?: boolean;
}

const PlantTimelineChart: React.FC<PlantTimelineChartProps> = ({ mockData = true }) => {
  const theme = useTheme();

  // Mock data for timeline phases
  const mockPhases: TimelinePhase[] = [
    {
      id: '1',
      name: 'Germination',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-08'),
      isActive: false,
      isCompleted: true,
      isFuture: false
    },
    {
      id: '2', 
      name: 'Seedling',
      startDate: new Date('2024-07-08'),
      endDate: new Date('2024-07-22'),
      isActive: false,
      isCompleted: true,
      isFuture: false
    },
    {
      id: '3',
      name: 'Vegetation',
      startDate: new Date('2024-07-22'),
      endDate: new Date('2024-08-15'), // Current phase
      isActive: true,
      isCompleted: false,
      isFuture: false
    },
    {
      id: '4',
      name: 'Pre-flower',
      startDate: new Date('2024-08-15'),
      endDate: new Date('2024-08-25'),
      isActive: false,
      isCompleted: false,
      isFuture: true
    },
    {
      id: '5',
      name: 'Flowering',
      startDate: new Date('2024-08-25'),
      endDate: new Date('2024-10-10'),
      isActive: false,
      isCompleted: false,
      isFuture: true
    },
    {
      id: '6',
      name: 'Flushing',
      startDate: new Date('2024-10-10'),
      endDate: new Date('2024-10-17'),
      isActive: false,
      isCompleted: false,
      isFuture: true
    },
    {
      id: '7',
      name: 'Harvest',
      startDate: new Date('2024-10-17'),
      endDate: new Date('2024-10-18'),
      isActive: false,
      isCompleted: false,
      isFuture: true
    }
  ];

  const today = new Date();
  const timelineStart = mockPhases[0].startDate;
  const timelineEnd = mockPhases[mockPhases.length - 1].endDate;
  const totalDays = differenceInDays(timelineEnd, timelineStart);

  // Calculate position percentage for a given date
  const getPositionPercentage = (date: Date): number => {
    const daysFromStart = differenceInDays(date, timelineStart);
    return (daysFromStart / totalDays) * 100;
  };

  // Get color for phase marker
  const getPhaseColor = (phase: TimelinePhase): string => {
    if (phase.isActive) return theme.palette.primary.main;
    if (phase.isCompleted) return theme.palette.success.main;
    if (phase.isFuture) return theme.palette.grey[400];
    return theme.palette.grey[500];
  };

  // Get background color for phase segment
  const getPhaseBackgroundColor = (phase: TimelinePhase): string => {
    if (phase.isActive) return `${theme.palette.primary.main}20`;
    if (phase.isCompleted) return `${theme.palette.success.main}15`;
    if (phase.isFuture) return `${theme.palette.grey[300]}15`;
    return `${theme.palette.grey[400]}15`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Plant Timeline
      </Typography>
      
      {/* Timeline container */}
      <Box sx={{ position: 'relative', mt: 4, mb: 8, height: 140 }}>
        {/* Main timeline line */}
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            left: '5%',
            right: '5%',
            height: 4,
            backgroundColor: theme.palette.grey[300],
            borderRadius: 2
          }}
        />

        {/* Phase segments */}
        {mockPhases.map((phase, index) => {
          const startPos = Math.max(5, getPositionPercentage(phase.startDate) * 0.9 + 5);
          const endPos = Math.min(95, getPositionPercentage(phase.endDate) * 0.9 + 5);
          const width = endPos - startPos;
          const isStaggered = index % 2 === 1;

          return (
            <Box
              key={phase.id}
              sx={{
                position: 'absolute',
                left: `${startPos}%`,
                width: `${width}%`,
                top: 0,
                height: 140
              }}
            >
              {/* Phase background segment */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 58,
                  left: 0,
                  right: 0,
                  height: 8,
                  backgroundColor: getPhaseBackgroundColor(phase),
                  borderRadius: 2,
                  border: phase.isActive ? `2px solid ${theme.palette.primary.main}` : 'none'
                }}
              />

              {/* Phase marker (start point) */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 56,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: getPhaseColor(phase),
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[2],
                  zIndex: 2
                }}
              />

              {/* Phase label */}
              <Box
                sx={{
                  position: 'absolute',
                  left: width > 8 ? '50%' : 0,
                  top: isStaggered ? 5 : -15,
                  transform: width > 8 ? 'translateX(-50%)' : 'translateX(-25%)',
                  minWidth: 60,
                  maxWidth: Math.max(60, width * 8),
                  textAlign: 'center',
                  zIndex: 3
                }}
              >
                <Chip
                  label={phase.name}
                  size="small"
                  sx={{
                    backgroundColor: getPhaseColor(phase),
                    color: phase.isFuture ? theme.palette.text.secondary : theme.palette.getContrastText(getPhaseColor(phase)),
                    fontWeight: phase.isActive ? 'bold' : 'normal',
                    opacity: phase.isFuture ? 0.7 : 1,
                    fontSize: width < 8 ? '0.65rem' : '0.75rem',
                    height: width < 8 ? 20 : 24
                  }}
                />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    mt: 0.5,
                    color: phase.isFuture ? theme.palette.text.secondary : theme.palette.text.primary,
                    opacity: phase.isFuture ? 0.7 : 1,
                    fontSize: width < 8 ? '0.6rem' : '0.75rem'
                  }}
                >
                  {format(phase.startDate, 'MMM dd')}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {/* Current date marker */}
        <Box
          sx={{
            position: 'absolute',
            left: `${Math.max(5, Math.min(95, getPositionPercentage(today) * 0.9 + 5))}%`,
            top: 35,
            transform: 'translateX(-50%)',
            zIndex: 4
          }}
        >
          {/* Current date line */}
          <Box
            sx={{
              width: 3,
              height: 50,
              backgroundColor: theme.palette.error.main,
              mb: 1,
              borderRadius: 1
            }}
          />
          
          {/* Current date label */}
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              boxShadow: theme.shadows[2]
            }}
          >
            TODAY
          </Box>
        </Box>

        {/* Date scale at bottom */}
        <Box
          sx={{
            position: 'absolute',
            top: 110,
            left: '5%',
            right: '5%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Start date */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {format(timelineStart, 'MMM dd, yyyy')}
          </Typography>
          
          {/* Middle dates */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {format(addDays(timelineStart, Math.floor(totalDays / 2)), 'MMM dd')}
          </Typography>
          
          {/* End date */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {format(timelineEnd, 'MMM dd, yyyy')}
          </Typography>
        </Box>
      </Box>

      {/* Timeline summary */}
      <Box sx={{ mt: 6, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Total grow time: {totalDays} days
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current day: {Math.min(totalDays, Math.max(1, differenceInDays(today, timelineStart) + 1))}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Days remaining: {Math.max(0, differenceInDays(timelineEnd, today))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default PlantTimelineChart;