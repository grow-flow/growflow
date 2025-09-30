import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box, Alert, AlertTitle } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught error:', error);
    console.error('🔴 Component stack:', errorInfo.componentStack);
    console.error('🔴 Error stack:', error.stack);
    this.setState({ errorInfo });
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const isReactError = errorMessage.includes('Minified React error');
      const buildVersion = new Date().toISOString().slice(0, 16).replace('T', ' ');

      return (
        <>
          {this.props.children}
          <Dialog
            open={true}
            onClose={this.handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderTop: 4,
                borderColor: 'error.main'
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
                <Typography variant="h6">Application Error</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Error Details</AlertTitle>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {errorMessage}
                </Typography>
              </Alert>

              {isReactError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>React Hook Error Detected</AlertTitle>
                  <Typography variant="body2">
                    This is likely caused by:
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li>Using hooks outside of a React component</li>
                      <li>Multiple React versions loaded</li>
                      <li>Calling hooks conditionally</li>
                    </ul>
                  </Typography>
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Build Info</AlertTitle>
                <Typography variant="body2">
                  <strong>Version:</strong> v0.1.7<br />
                  <strong>Build Time:</strong> {buildVersion}<br />
                  <strong>Environment:</strong> {process.env.NODE_ENV || 'production'}
                </Typography>
              </Alert>

              {this.state.errorInfo && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Component Stack:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button onClick={this.handleClose} color="inherit">
                Dismiss
              </Button>
              <Button
                onClick={this.handleReload}
                variant="contained"
                color="error"
                startIcon={<RefreshIcon />}
              >
                Reload Application
              </Button>
            </DialogActions>
          </Dialog>
        </>
      );
    }

    return this.props.children;
  }
}
