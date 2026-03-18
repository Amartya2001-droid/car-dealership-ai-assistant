import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-stone-600 mb-6">
            We couldn't connect to the backend server. Please make sure the Express server is running.
          </p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error || 'Connection failed'}
          </AlertDescription>
        </Alert>

        <div className="bg-stone-100 border border-stone-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-stone-700 mb-2">Quick Troubleshooting:</p>
          <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
            <li>Ensure the Express backend server is running</li>
            <li>Check that the backend is accessible at the configured URL</li>
            <li>Verify CORS settings allow frontend connections</li>
            <li>Review browser console for additional error details</li>
          </ul>
        </div>

        <Button
          onClick={onRetry}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          data-testid="retry-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>

        <div className="text-center text-sm text-stone-500">
          <p>Backend URL: <code className="bg-stone-200 px-2 py-1 rounded text-xs">{process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'}</code></p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
