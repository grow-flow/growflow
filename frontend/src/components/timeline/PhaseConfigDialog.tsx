import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { PlantPhase } from "@/types/models";
import { PlantTimeline } from "@/utils/PlantTimeline";
import { PhaseEditDialog } from "./PhaseEditDialog";

interface PhaseConfigDialogProps {
  open: boolean;
  phases: PlantPhase[];
  plantTimeline: PlantTimeline;
  onClose: () => void;
  onSave: (phases: PlantPhase[]) => void;
  isSaving: boolean;
}

interface SortablePhaseCardProps {
  phase: PlantPhase;
  index: number;
  isCurrent: boolean;
  onEdit: (phase: PlantPhase) => void;
  onDelete: (phase: PlantPhase) => void;
}

const SortablePhaseCard: React.FC<SortablePhaseCardProps> = ({ phase, index, isCurrent, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: phase.id || `new-${index}`,
  });

  const isStarted = !!phase.startDate;

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 8,
      }}
      sx={{
        border: isCurrent ? '2px solid' : '1px solid',
        borderColor: isCurrent ? 'primary.main' : 'divider',
        backgroundColor: isStarted ? 'action.hover' : 'background.paper',
        cursor: 'pointer',
        '&:hover': { boxShadow: 2 },
      }}
      onClick={() => onEdit(phase)}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: 'text.disabled', touchAction: 'none' }}
          >
            <DragIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={isCurrent ? 600 : 400}>
                {index + 1}. {phase.name}
              </Typography>
              {isCurrent && <Chip label="Current" size="small" color="primary" />}
              {isStarted && !isCurrent && <CheckIcon fontSize="small" color="success" />}
            </Box>
            <Typography variant="caption" color="textSecondary">
              {phase.durationMin}-{phase.durationMax} days
              {isStarted && ` | Started: ${format(new Date(phase.startDate!), 'dd/MM/yy')}`}
            </Typography>
          </Box>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); onDelete(phase); }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export const PhaseConfigDialog: React.FC<PhaseConfigDialogProps> = ({
  open,
  phases,
  plantTimeline,
  onClose,
  onSave,
  isSaving,
}) => {
  const [editablePhases, setEditablePhases] = useState<PlantPhase[]>([]);
  const [newPhaseDialog, setNewPhaseDialog] = useState(false);
  const [editPhaseDialog, setEditPhaseDialog] = useState<PlantPhase | null>(null);
  const [confirmDeletePhase, setConfirmDeletePhase] = useState<PlantPhase | null>(null);

  useEffect(() => {
    if (open) setEditablePhases(phases.map(p => ({ ...p })));
  }, [open, phases]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editablePhases.findIndex(p => (p.id || `new-${editablePhases.indexOf(p)}`) === active.id);
      const newIndex = editablePhases.findIndex(p => (p.id || `new-${editablePhases.indexOf(p)}`) === over.id);
      setEditablePhases(arrayMove(editablePhases, oldIndex, newIndex));
    }
  };

  const doDelete = (phaseId: number) =>
    setEditablePhases(prev => prev.filter(p => p.id !== phaseId));

  const handleDeletePhase = (phase: PlantPhase) => {
    if (editablePhases.length <= 1) return alert('Must have at least one phase');
    if (phase.startDate) return setConfirmDeletePhase(phase);
    if (window.confirm(`Delete "${phase.name}" phase?`)) doDelete(phase.id);
  };

  const handleUpdatePhase = (updatedPhase: PlantPhase) => {
    setEditablePhases(editablePhases.map(p => p.id === updatedPhase.id ? updatedPhase : p));
  };

  const handleAddPhase = (phase: PlantPhase) => {
    setEditablePhases([...editablePhases, { ...phase, sortOrder: editablePhases.length }]);
  };

  const closeEditDialog = () => {
    setNewPhaseDialog(false);
    setEditPhaseDialog(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Configure Phases</Typography>
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={editablePhases.map((p, i) => p.id || `new-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {editablePhases.map((phase, index) => (
                <SortablePhaseCard
                  key={phase.id || `new-${index}`}
                  phase={phase}
                  index={index}
                  isCurrent={plantTimeline.currentPhase?.id === phase.id}
                  onEdit={setEditPhaseDialog}
                  onDelete={handleDeletePhase}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setNewPhaseDialog(true)}>
              Add Phase
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button onClick={() => onSave(editablePhases)} variant="contained" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <PhaseEditDialog
        phase={newPhaseDialog ? null : editPhaseDialog}
        open={newPhaseDialog || !!editPhaseDialog}
        onClose={closeEditDialog}
        onSave={(phase) => {
          if (newPhaseDialog) handleAddPhase(phase);
          else handleUpdatePhase(phase);
          closeEditDialog();
        }}
      />

      <Dialog open={!!confirmDeletePhase} onClose={() => setConfirmDeletePhase(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Started Phase?</DialogTitle>
        <DialogContent>
          <Typography>
            This phase has already started. Deleting it will remove its start date and reassign its events. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeletePhase(null)} color="inherit">Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirmDeletePhase) doDelete(confirmDeletePhase.id);
              setConfirmDeletePhase(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
