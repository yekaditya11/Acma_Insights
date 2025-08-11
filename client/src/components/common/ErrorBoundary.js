/**
 * Error Boundary Component
 * Catches and displays errors gracefully
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
            }}
          >
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              icon={<ErrorIcon />}
            >
              <AlertTitle>Something went wrong</AlertTitle>
              An error occurred while loading the dashboard. Please try refreshing the page.
            </Alert>

            <Typography variant="h6" gutterBottom>
              Dashboard Error
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry for the inconvenience. The safety dashboard encountered an unexpected error.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                color="primary"
              >
                Refresh Page
              </Button>
            </Box>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
