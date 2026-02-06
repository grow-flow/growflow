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
} from "@mui/icons-material";
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

  useEffect(() => {
    if (open) setEditablePhases([...phases]);
  }, [open, phases]);

  const handleDeletePhase = (phaseId: number) => {
    const phase = editablePhases.find(p => p.id === phaseId);
    if (phase?.startDate) return alert('Cannot delete a phase that has already started');
    if (editablePhases.length <= 1) return alert('Must have at least one phase');
    if (window.confirm(`Delete "${phase?.name}" phase?`)) {
      setEditablePhases(editablePhases.filter(p => p.id !== phaseId));
    }
  };

  const handleUpdatePhase = (updatedPhase: PlantPhase) => {
    setEditablePhases(editablePhases.map(p => p.id === updatedPhase.id ? updatedPhase : p));
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
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click a phase to edit. Delete phases that haven't started.
          </Typography>

          {editablePhases.map((phase, index) => {
            const isStarted = !!phase.startDate;
            const isCurrent = plantTimeline.currentPhase?.id === phase.id;
            return (
              <Card
                key={phase.id}
                sx={{
                  mb: 1,
                  border: isCurrent ? '2px solid' : '1px solid',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  backgroundColor: isStarted ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => setEditPhaseDialog(phase)}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      onClick={(e) => { e.stopPropagation(); handleDeletePhase(phase.id); }}
                      disabled={isStarted}
                      sx={{ opacity: isStarted ? 0.3 : 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}

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
        onClose={() => { setNewPhaseDialog(false); setEditPhaseDialog(null); }}
        onSave={(phase) => {
          if (newPhaseDialog) setEditablePhases([...editablePhases, phase]);
          else handleUpdatePhase(phase);
          setNewPhaseDialog(false);
          setEditPhaseDialog(null);
        }}
      />
    </>
  );
};
