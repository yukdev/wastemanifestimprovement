import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Collapse,
  Box,
  Paper,
  Fade,
  Button,
} from '@mui/material';
import ExpandedLineItems from './ExpandedLineItems';
import PageIndicator from './PageIndicator';
import PaginationArrows from './PaginationArrows';

// Define ManifestSummaryRow type
interface ManifestSummaryRow {
  manifestNum: string;
  shipDate: string;
  generatorName: string;
  epaCodes: string;
  pWaste: number;
  hazWaste: number;
  nonHazWaste: number;
  lineItems: Record<string, string>[];
}

interface WmrTableProps {
  summaryRows: ManifestSummaryRow[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  columnWidths: number[];
  columnLabels: string[];
  columnAlign: Array<'left' | 'center' | 'right'>;
  onHeaderContextMenu?: (
    event: React.MouseEvent<HTMLElement>,
    columnKey: string,
  ) => void;
  onClearFilter?: () => void;
}

const columnKeys = [
  'shipDate',
  'generatorName',
  'manifestNum',
  'pWaste',
  'hazWaste',
  'nonHazWaste',
  'epaCodes',
];

const headerHeight = 56;
const rowHeight = 56;

const WmrTable: React.FC<WmrTableProps> = ({
  summaryRows,
  expanded,
  setExpanded,
  columnWidths,
  columnLabels,
  columnAlign,
  onHeaderContextMenu,
  onClearFilter,
}) => {
  // Sorting state and logic are self-contained here
  const [sortBy, setSortBy] = useState<string>('shipDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic rowsPerPage based on viewport
  useEffect(() => {
    function updateRowsPerPage() {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 8;
        const rows = Math.max(
          1,
          Math.floor((availableHeight - headerHeight) / rowHeight),
        );
        setRowsPerPage(rows);
      }
    }
    updateRowsPerPage();
    window.addEventListener('resize', updateRowsPerPage);
    const raf = requestAnimationFrame(updateRowsPerPage);
    return () => {
      window.removeEventListener('resize', updateRowsPerPage);
      cancelAnimationFrame(raf);
    };
  }, [summaryRows]);

  // Sort rows
  const sortedRows = useMemo(() => {
    let rows = [...summaryRows];
    rows = rows.sort((a, b) => {
      let aVal = a[sortBy as keyof ManifestSummaryRow];
      let bVal = b[sortBy as keyof ManifestSummaryRow];
      if (
        sortBy === 'pWaste' ||
        sortBy === 'hazWaste' ||
        sortBy === 'nonHazWaste'
      ) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (sortBy === 'shipDate') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [summaryRows, sortBy, sortOrder]);

  // Paginate after sorting
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const rowsToShow = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  // Reset page if data or rowsPerPage changes
  useEffect(() => {
    setPage(0);
  }, [sortedRows.length, rowsPerPage]);

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 24px 0 rgba(25, 118, 210, 0.08)',
        border: '1px solid #e0e0e0',
        p: 2,
        mb: 4,
        background: '#fafbfc',
        width: '100%',
        overflow: 'visible',
      }}
    >
      <Box ref={tableContainerRef} sx={{ width: '100%', overflowY: 'auto' }}>
        <PageIndicator page={page} totalPages={totalPages} />
        <Table
          size="small"
          stickyHeader
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            tableLayout: 'auto',
            width: '100%',
          }}
        >
          <TableHead>
            <TableRow sx={{ height: 80, minHeight: 80 }}>
              {columnLabels.map((label, idx) => (
                <TableCell
                  key={label}
                  sx={{
                    ...(label === 'EPA Codes'
                      ? {
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }
                      : {
                          minWidth: columnWidths[idx],
                          maxWidth: columnWidths[idx],
                          width: columnWidths[idx],
                        }),
                    fontWeight: 800,
                    background:
                      'linear-gradient(90deg, #f0f4fa 0%, #e8f0fe 100%)',
                    color: '#1976d2',
                    fontSize: 17,
                    borderRight:
                      idx < columnLabels.length - 1
                        ? '1px solid #e0e0e0'
                        : undefined,
                    // Remove whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                    overflow: 'hidden',
                    textAlign: columnAlign[idx] as 'left' | 'center' | 'right',
                    cursor: 'pointer',
                    zIndex: 100,
                    letterSpacing: 0.2,
                    height: 80,
                    minHeight: 80,
                    verticalAlign: 'middle',
                  }}
                  onContextMenu={
                    onHeaderContextMenu
                      ? (e) => onHeaderContextMenu(e, columnKeys[idx])
                      : undefined
                  }
                  onClick={() => {
                    if (sortBy === columnKeys[idx]) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(columnKeys[idx]);
                      setSortOrder('asc');
                    }
                  }}
                >
                  {label}{' '}
                  {sortBy === columnKeys[idx]
                    ? sortOrder === 'asc'
                      ? '▲'
                      : '▼'
                    : ''}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rowsToShow.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnLabels.length} align="center">
                  No results found.
                  {onClearFilter && (
                    <Button onClick={onClearFilter} size="small" sx={{ ml: 2 }}>
                      Clear Filter
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rowsToShow.map((row, i) => (
                <React.Fragment key={`${row.manifestNum}-${i}`}>
                  <TableRow
                    hover
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: i % 2 === 0 ? '#f7fafd' : '#e8f0fe',
                      '&:hover': { backgroundColor: '#e3f2fd !important' },
                      '&.Mui-selected, &.Mui-selected:hover': {
                        backgroundColor: '#fff !important',
                        boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.10)',
                      },
                      color: 'black',
                      minHeight: 56,
                      height: 56,
                      transition: 'background 0.2s',
                    }}
                    onClick={() =>
                      setExpanded(
                        expanded === row.manifestNum ? null : row.manifestNum,
                      )
                    }
                    selected={expanded === row.manifestNum}
                  >
                    {/* Ship Date */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[0],
                        maxWidth: columnWidths[0],
                        width: columnWidths[0],
                        height: 56,
                        textAlign: columnAlign[0] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.shipDate} arrow>
                        <span>{row.shipDate}</span>
                      </Tooltip>
                    </TableCell>
                    {/* Generator Name */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[1],
                        maxWidth: columnWidths[1],
                        width: columnWidths[1],
                        height: 56,
                        textAlign: columnAlign[1] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.generatorName} arrow>
                        <span>{row.generatorName}</span>
                      </Tooltip>
                    </TableCell>
                    {/* Manifest # */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[2],
                        maxWidth: columnWidths[2],
                        width: columnWidths[2],
                        height: 56,
                        textAlign: columnAlign[2] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.manifestNum} arrow>
                        <span>{row.manifestNum}</span>
                      </Tooltip>
                    </TableCell>
                    {/* P-listed Waste */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[3],
                        maxWidth: columnWidths[3],
                        width: columnWidths[3],
                        height: 56,
                        textAlign: columnAlign[3] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.pWaste.toString()} arrow>
                        <span>{row.pWaste ? Math.round(row.pWaste) : ''}</span>
                      </Tooltip>
                    </TableCell>
                    {/* Hazardous Waste */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[4],
                        maxWidth: columnWidths[4],
                        width: columnWidths[4],
                        height: 56,
                        textAlign: columnAlign[4] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.hazWaste.toString()} arrow>
                        <span>
                          {row.hazWaste ? Math.round(row.hazWaste) : ''}
                        </span>
                      </Tooltip>
                    </TableCell>
                    {/* Non-Hazardous Waste */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[5],
                        maxWidth: columnWidths[5],
                        width: columnWidths[5],
                        height: 56,
                        textAlign: columnAlign[5] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Tooltip title={row.nonHazWaste.toString()} arrow>
                        <span>
                          {row.nonHazWaste ? Math.round(row.nonHazWaste) : ''}
                        </span>
                      </Tooltip>
                    </TableCell>
                    {/* EPA Codes */}
                    <TableCell
                      sx={{
                        minWidth: columnWidths[6],
                        maxWidth: columnWidths[6],
                        width: columnWidths[6],
                        height: 56,
                        textAlign: columnAlign[6] as
                          | 'left'
                          | 'center'
                          | 'right',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Tooltip title={row.epaCodes} arrow>
                        <span>{row.epaCodes}</span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <Fade
                    in={expanded === row.manifestNum}
                    timeout={400}
                    unmountOnExit
                  >
                    <TableRow
                      sx={{
                        backgroundColor: '#fff !important',
                        boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.10)',
                        borderBottom: '2px solid #e0e0e0',
                      }}
                    >
                      <TableCell
                        colSpan={columnLabels.length}
                        sx={{ p: 0, background: '#fff !important', border: 0 }}
                      >
                        <Collapse
                          in={expanded === row.manifestNum}
                          timeout="auto"
                          unmountOnExit
                        >
                          <ExpandedLineItems lineItems={row.lineItems} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fade>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationArrows
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
        />
      </Box>
    </Paper>
  );
};

export default WmrTable;
