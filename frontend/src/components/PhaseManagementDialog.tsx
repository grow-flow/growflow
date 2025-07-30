import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Plant } from '../types/models';
import SimpleTimeline from './SimpleTimeline';

interface PhaseManagementDialogProps {
  open: boolean;
  onClose: () => void;
  plant: Plant | null;
}

const PhaseManagementDialog: React.FC<PhaseManagementDialogProps> = ({
  open,
  onClose,
  plant
}) => {
  if (!plant) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Timeline: {plant.name}</DialogTitle>
      <DialogContent>
        <SimpleTimeline plant={plant} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhaseManagementDialog;