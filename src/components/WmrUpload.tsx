import React from 'react';
import { Paper, Typography, Button, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Divider } from '@mui/material';

interface WmrUploadProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  uomError: boolean;
  loading?: boolean;
}

const WmrUpload: React.FC<WmrUploadProps> = ({
  onFileUpload,
  error,
  uomError,
  loading,
}) => (
  <Paper
    elevation={6}
    sx={{
      p: 4,
      width: '100%',
      maxWidth: 700,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: 3,
      boxShadow: '0 6px 32px 0 rgba(25, 118, 210, 0.10)',
      background: '#fafbfc',
      mb: 6,
    }}
  >
    <Typography
      variant="body1"
      sx={{ mb: 3, fontSize: 18, textAlign: 'center' }}
    >
      Upload your Waste Management Report (CSV/XLS/XLSX). The app will group
      line items by manifest, sum weights, and extract EPA codes.
    </Typography>
    <Button
      variant="contained"
      component="label"
      disabled={loading}
      startIcon={<UploadFileIcon />}
      sx={{
        fontSize: 18,
        py: 1.5,
        px: 4,
        borderRadius: 2,
        background: '#1976d2',
        boxShadow: '0 2px 8px 0 rgba(25, 118, 210, 0.10)',
        '&:hover': { background: '#1565c0' },
        mb: 2,
      }}
    >
      Upload WMR File
      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        hidden
        onChange={onFileUpload}
      />
    </Button>
    {error && (
      <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
        {error}
      </Alert>
    )}
    {uomError && (
      <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
        Warning: Some line items have a unit of measure other than Lbs. Only Lbs
        are summed for total weight.
      </Alert>
    )}
    <Divider sx={{ mt: 4, width: '100%' }} />
  </Paper>
);

export default WmrUpload;
