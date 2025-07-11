import React from 'react';
import { IconButton, Box } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface PaginationArrowsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

const PaginationArrows: React.FC<PaginationArrowsProps> = ({
  page,
  totalPages,
  onPrev,
  onNext,
}) => {
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          left: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2000,
        }}
      >
        <IconButton
          onClick={onPrev}
          disabled={page === 0}
          sx={{
            background: '#1976d2',
            color: '#fff',
            width: 64,
            height: 64,
            boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.15)',
            '&:hover': {
              background: '#1565c0',
            },
            opacity: page === 0 ? 0.3 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
          aria-label="Previous page"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 36 }} />
        </IconButton>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2000,
        }}
      >
        <IconButton
          onClick={onNext}
          disabled={page + 1 >= totalPages}
          sx={{
            background: '#1976d2',
            color: '#fff',
            width: 64,
            height: 64,
            boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.15)',
            '&:hover': {
              background: '#1565c0',
            },
            opacity: page + 1 >= totalPages ? 0.3 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
          aria-label="Next page"
        >
          <ArrowForwardIosIcon sx={{ fontSize: 36 }} />
        </IconButton>
      </Box>
    </>
  );
};

export default PaginationArrows;
