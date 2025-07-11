import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageIndicatorProps {
  page: number;
  totalPages: number;
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ page, totalPages }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    mb={2}
    height={40}
  >
    <Typography variant="body2" sx={{ lineHeight: '40px', fontSize: 18 }}>
      Page {page + 1} of {totalPages}
    </Typography>
  </Box>
);

export default PageIndicator;
