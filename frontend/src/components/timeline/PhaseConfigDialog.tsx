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
  TextField,
  Divider,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { PlantPhaseInstance } from "@/types/models";
import { PlantTimeline } from "@/utils/PlantTimeline";
import { SortablePhaseCard } from "./SortablePhaseCard";
import { PhaseEditDialog } from "./PhaseEditDialog";

interface PhaseConfigDialogProps {
  open: boolean;
  phases: PlantPhaseInstance[];
  plantTimeline: PlantTimeline;
  onClose: () => void;
  onSave: (phases: PlantPhaseInstance[]) => void;
  isSaving: boolean;
}

export const PhaseConfigDialog: React.FC<PhaseConfigDialogProps> = ({
  open,
  phases,
  plantTimeline,
  onClose,
  onSave,
  isSaving,
}) => {
  const [editablePhases, setEditablePhases] = useState<PlantPhaseInstance[]>([]);
  const [phaseJsonInput, setPhaseJsonInput] = useState('');
  const [newPhaseDialog, setNewPhaseDialog] = useState(false);
  const [editPhaseDialog, setEditPhaseDialog] = useState<PlantPhaseInstance | null>(null);

  useEffect(() => {
    if (open) {
      setEditablePhases([...phases]);
      const completeData = createCompletePhaseData(phases);
      setPhaseJsonInput(JSON.stringify(completeData, null, 2));
    }
  }, [open, phases]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createCompletePhaseData = (phasesData: PlantPhaseInstance[]) => {
    return phasesData.map(phase => ({
      id: phase.id,
      name: phase.name,
      duration_min: phase.duration_min,
      duration_max: phase.duration_max,
      description: phase.description,
      is_active: phase.is_active,
      is_completed: phase.is_completed,
      start_date: phase.start_date
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = editablePhases.findIndex((phase) => phase.id === active.id);
      const newIndex = editablePhases.findIndex((phase) => phase.id === over.id);
      const newPhases = arrayMove(editablePhases, oldIndex, newIndex);
      setEditablePhases(newPhases);
      setPhaseJsonInput(JSON.stringify(createCompletePhaseData(newPhases), null, 2));
    }
  };

  const handleDeletePhase = (phaseId: string) => {
    const phase = editablePhases.find(p => p.id === phaseId);
    if (phase?.start_date) {
      alert('Cannot delete a phase that has already started');
      return;
    }

    if (editablePhases.length <= 1) {
      alert('Must have at least one phase');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the "${phase?.name}" phase?`)) {
      const newPhases = editablePhases.filter(p => p.id !== phaseId);
      setEditablePhases(newPhases);
      setPhaseJsonInput(JSON.stringify(createCompletePhaseData(newPhases), null, 2));
    }
  };

  const handleUpdatePhase = (updatedPhase: PlantPhaseInstance) => {
    const newPhases = editablePhases.map(p => p.id === updatedPhase.id ? updatedPhase : p);
    setEditablePhases(newPhases);
    setPhaseJsonInput(JSON.stringify(createCompletePhaseData(newPhases), null, 2));
  };

  const exportPhaseTemplates = () => {
    const completeData = createCompletePhaseData(editablePhases);
    const json = JSON.stringify(completeData, null, 2);
    navigator.clipboard.writeText(json);
    setPhaseJsonInput(json);
  };

  const convertToPhaseInstances = (templates: any[]) => {
    return templates.map(template => ({
      id: template.id || crypto.randomUUID(),
      name: template.name,
      duration_min: template.duration_min,
      duration_max: template.duration_max,
      description: template.description,
      is_active: template.is_active || false,
      is_completed: template.is_completed || false,
      start_date: template.start_date || undefined
    }));
  };

  const importPhaseTemplates = () => {
    try {
      const parsed = JSON.parse(phaseJsonInput);
      if (Array.isArray(parsed) && parsed.every(p => p.name && typeof p.duration_min === 'number' && typeof p.duration_max === 'number')) {
        const newPhases = convertToPhaseInstances(parsed);
        setEditablePhases(newPhases);
      } else {
        alert('Invalid JSON format. Expected array of phase templates with name, duration_min, duration_max.');
      }
    } catch (error) {
      alert('Invalid JSON format. Please check the syntax.');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Configure Growth Phases</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 0 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Drag and drop to reorder phases. Click a phase to edit it. Delete phases that haven't started yet.
          </Typography>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={editablePhases.map(phase => phase.id)}
              strategy={verticalListSortingStrategy}
            >
              {editablePhases.map((phase, index) => (
                <SortablePhaseCard
                  key={phase.id}
                  phase={phase}
                  index={index}
                  plantTimeline={plantTimeline}
                  onEdit={setEditPhaseDialog}
                  onDelete={handleDeletePhase}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setNewPhaseDialog(true)}
            >
              Add Phase
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              JSON Export/Import
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Copy the phase configuration or import a new configuration via JSON.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={exportPhaseTemplates}
                variant="outlined"
              >
                Copy to Clipboard
              </Button>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={8}
              value={phaseJsonInput}
              onChange={(e) => setPhaseJsonInput(e.target.value)}
              placeholder="Paste or edit phase templates JSON here..."
              variant="outlined"
              label="JSON Configuration"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.875rem'
                }
              }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<UploadIcon />}
                onClick={importPhaseTemplates}
                variant="contained"
                disabled={!phaseJsonInput.trim()}
              >
                Import JSON
              </Button>
              <Button
                size="small"
                onClick={() => setPhaseJsonInput('')}
                disabled={!phaseJsonInput.trim()}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => onSave(editablePhases)}
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <PhaseEditDialog
        phase={newPhaseDialog ? null : editPhaseDialog}
        open={newPhaseDialog || !!editPhaseDialog}
        onClose={() => {
          setNewPhaseDialog(false);
          setEditPhaseDialog(null);
        }}
        onSave={(phase) => {
          if (newPhaseDialog) {
            setEditablePhases([...editablePhases, phase]);
            setPhaseJsonInput(JSON.stringify(createCompletePhaseData([...editablePhases, phase]), null, 2));
          } else {
            handleUpdatePhase(phase);
          }
          setNewPhaseDialog(false);
          setEditPhaseDialog(null);
        }}
      />
    </>
  );
};
