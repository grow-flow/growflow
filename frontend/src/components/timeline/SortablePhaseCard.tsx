import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { PlantPhaseInstance } from "@/types/models";
import { PlantTimeline } from "@/utils/PlantTimeline";

interface SortablePhaseCardProps {
  phase: PlantPhaseInstance;
  index: number;
  plantTimeline: PlantTimeline;
  onEdit: (phase: PlantPhaseInstance) => void;
  onDelete: (phaseId: string) => void;
}

export const SortablePhaseCard: React.FC<SortablePhaseCardProps> = ({
  phase,
  index,
  plantTimeline,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isStarted = !!phase.start_date;
  const isCurrent = plantTimeline.currentPhase?.id === phase.id;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        border: isCurrent ? '2px solid' : '1px solid',
        borderColor: isCurrent ? 'primary.main' : 'divider',
        backgroundColor: isStarted ? 'action.hover' : 'background.paper',
        cursor: 'pointer',
        '&:hover': { boxShadow: 2 }
      }}
      onClick={() => onEdit(phase)}
    >
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { cursor: 'grabbing' },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DragIndicatorIcon />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: isCurrent ? 600 : 400 }}>
                {index + 1}. {phase.name}
              </Typography>
              {isCurrent && <Chip label="Current" size="small" color="primary" />}
              {isStarted && !isCurrent && <CheckIcon fontSize="small" color="success" />}
            </Box>

            <Typography variant="caption" color="textSecondary" display="block">
              Duration: {phase.duration_min}-{phase.duration_max} days
            </Typography>

            {phase.description && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {phase.description}
              </Typography>
            )}

            {isStarted && (
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                Started: {format(new Date(phase.start_date!), 'dd/MM/yy')}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(phase.id);
            }}
            disabled={!!phase.start_date}
            sx={{ opacity: phase.start_date ? 0.3 : 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};
