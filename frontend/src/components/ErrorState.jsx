import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold font-display mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't connect to the backend server. Please make sure the Express server is running.
          </p>
        </div>

        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>Error:</strong> {error || 'Connection failed'}
          </AlertDescription>
        </Alert>

        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">Quick Troubleshooting:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Ensure the Express backend server is running</li>
            <li>Check that the backend is accessible at the configured URL</li>
            <li>Verify CORS settings allow frontend connections</li>
            <li>Review browser console for additional error details</li>
          </ul>
        </div>

        <Button
          onClick={onRetry}
          className="w-full"
          data-testid="retry-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Backend URL: <code className="bg-muted px-2 py-1 rounded text-xs">{process.env.REACT_APP_BACKEND_URL || 'same-origin via dev proxy'}</code></p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
