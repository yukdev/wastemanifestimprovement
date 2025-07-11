'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Popover,
  TextField,
  IconButton,
  Button,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import WmrUpload from '../components/WmrUpload';
import WmrTable from '../components/WmrTable';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Head from 'next/head';

function getManifestType(manifestNum: string) {
  if (manifestNum.startsWith('0')) return 'Hazardous';
  if (manifestNum.startsWith('ZZ')) return 'Non-Hazardous';
  return 'Unknown';
}

function exportSummaryRowsToCsv(
  summaryRows: Array<{
    manifestNum: string;
    shipDate: string;
    generatorName: string;
    epaCodes: string;
    pWaste: number;
    hazWaste: number;
    nonHazWaste: number;
    lineItems: Record<string, string>[];
  }>,
  columnLabels: string[],
  columnKeys: string[],
) {
  const header = columnLabels.join(',');
  const rows = summaryRows.map((row) =>
    columnKeys
      .map((key) => {
        let val = row[key as keyof typeof row];
        if (typeof val === 'string') {
          // Escape quotes and commas
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      })
      .join(','),
  );
  return [header, ...rows].join('\r\n');
}

export default function Home() {
  const [manifestData, setManifestData] = useState<Record<string, string>[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Sorting state
  // Add ref for table container and dynamic rowsPerPage
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerHeight = 56; // px
  const rowHeight = 56; // px

  // Group by Manifest #, filter, and sort
  const { summaryRows, uomError } = useMemo(() => {
    const groups: Record<string, Record<string, string>[]> = {};
    let uomError = false;
    manifestData.forEach((row) => {
      const manifestNum = row['Manifest #'] || '';
      // Filter out manifests starting with 'NY'
      if (manifestNum.startsWith('NY')) return;
      if (!groups[manifestNum]) groups[manifestNum] = [];
      groups[manifestNum].push(row);
      // Accept 'Lbs' or 'Pounds' (case-insensitive)
      if (row['UOM'] && !['lbs', 'pounds'].includes(row['UOM'].toLowerCase())) {
        uomError = true;
      }
    });
    const summaryRows = Object.entries(groups).map(([manifestNum, rows]) => {
      const manifestType = getManifestType(manifestNum);
      let pWaste = 0;
      let hazWaste = 0;
      let nonHazWaste = 0;
      const epaCodeSet = new Set();
      rows.forEach((row) => {
        const uom = row['UOM'] ? row['UOM'].toLowerCase() : '';
        const units = parseFloat(row['Lbs'] || '0');
        if (!['lbs', 'pounds'].includes(uom) || isNaN(units)) return;
        const roundedUnits = Math.round(units);
        const epaCodes = (row['US EPA Codes'] || '')
          .split(/[ ,]+/)
          .map((c) => c.trim())
          .filter(Boolean);
        epaCodes.forEach((c) => epaCodeSet.add(c));
        const hasPCode = epaCodes.some((code) => /^P\d+$/i.test(code));
        if (manifestType === 'Non-Hazardous') {
          // New logic: for ZZ manifests, if EPA code present, count as haz, else non-haz
          if (epaCodes.length > 0) {
            hazWaste += roundedUnits;
          } else {
            nonHazWaste += roundedUnits;
          }
        } else if (hasPCode) {
          pWaste += roundedUnits;
          hazWaste += roundedUnits; // P-waste is also haz waste
        } else {
          hazWaste += roundedUnits;
        }
      });
      // Remove 'VES' from manifestNum for display/export
      const manifestNumClean = manifestNum.replace(/VES\s*$/i, '');
      return {
        manifestNum: manifestNumClean,
        shipDate: rows[0]['Ship Date'] || '',
        generatorName: rows[0]['Generator Name'] || '',
        epaCodes: Array.from(epaCodeSet).join(', '),
        pWaste,
        hazWaste,
        nonHazWaste,
        lineItems: rows,
      };
    });
    return { summaryRows, uomError };
  }, [manifestData]);

  // Pagination logic
  // Remove pagedSummaryRows, page, rowsPerPage, and pagination logic from parent
  // Only pass summaryRows, expanded, setExpanded, columnWidths, columnLabels, columnAlign, renderEpaCodes to WmrTable
  // Remove PageIndicator and PaginationArrows from parent

  // Recalculate rowsPerPage after layout and whenever summaryRows changes
  useEffect(() => {
    function updateRowsPerPage() {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        // Use all space from top of table to bottom of viewport, minus a small buffer
        const availableHeight = window.innerHeight - rect.top - 8; // 8px buffer
        Math.max(1, Math.floor((availableHeight - headerHeight) / rowHeight));
        // setRowsPerPage(rows); // This line was removed as per the edit hint
      }
    }
    updateRowsPerPage();
    window.addEventListener('resize', updateRowsPerPage);
    // Recalculate after first layout and whenever summaryRows changes
    const raf = requestAnimationFrame(updateRowsPerPage);
    return () => {
      window.removeEventListener('resize', updateRowsPerPage);
      cancelAnimationFrame(raf);
    };
  }, [summaryRows]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setError(null);
    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('Parsed CSV results:', results);
          setManifestData(results.data as Record<string, string>[]);
        },
        error: (err) => {
          console.error('PapaParse error:', err);
        },
      });
    } else if (ext === 'xls' || ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        console.log('FileReader loaded:', evt);
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
        });
        console.log('Parsed XLSX results:', json);
        setManifestData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file type. Please upload a CSV or Excel file.');
      console.error('Unsupported file type:', ext);
    }
  };

  // 1. Update columns for new requirements
  const columnWidths = [130, 220, 180, 150, 150, 150, 320];
  const columnLabels = [
    'Ship Date',
    'Generator Name',
    'Manifest #',
    'P-listed Waste (Lbs.)',
    'Hazardous Waste (Lbs.)',
    'Non-Hazardous Waste (Lbs.)',
    'EPA Codes',
  ];
  const columnAlign: Array<'left' | 'center' | 'right'> = [
    'left', // Ship Date
    'left', // Generator Name
    'left', // Manifest #
    'center', // P-listed Waste
    'center', // Hazardous Waste
    'center', // Non-Hazardous Waste
    'left', // EPA Codes
  ];

  // Popover filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');

  // Add columnKeys to match the order in columnLabels
  const columnKeys = [
    'shipDate',
    'generatorName',
    'manifestNum',
    'pWaste',
    'hazWaste',
    'nonHazWaste',
    'epaCodes',
  ];

  // Filtering logic
  const filteredRows = useMemo(() => {
    const numericColumns = ['pWaste', 'hazWaste', 'nonHazWaste'];
    if (!filterColumn || !filterValue) return summaryRows;

    // Numeric filter support for numeric columns
    if (numericColumns.includes(filterColumn)) {
      // Match >, <, >=, <=, =, ==, !=
      const match = filterValue.match(/^([<>]=?|={1,2}|!=)\s*(-?\d+(\.\d+)?)$/);
      if (match) {
        const [, op, numStr] = match;
        const num = parseFloat(numStr);
        return summaryRows.filter((row: (typeof summaryRows)[number]) => {
          const value = row[filterColumn as keyof typeof row] as number;
          switch (op) {
            case '>':
              return value > num;
            case '>=':
              return value >= num;
            case '<':
              return value < num;
            case '<=':
              return value <= num;
            case '=':
            case '==':
              return value === num;
            case '!=':
              return value !== num;
            default:
              return false;
          }
        });
      }
      // fallback: string includes for non-numeric input
      return summaryRows.filter((row: (typeof summaryRows)[number]) =>
        String(row[filterColumn as keyof typeof row])
          .toLowerCase()
          .includes(filterValue.toLowerCase()),
      );
    }

    // Default string filter for other columns
    return summaryRows.filter((row: (typeof summaryRows)[number]) => {
      const val = row[filterColumn as keyof typeof row];
      if (val == null) return false;
      return String(val).toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [summaryRows, filterColumn, filterValue]);

  // Popover handlers
  const handleHeaderContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    columnKey: string,
  ) => {
    event.preventDefault();
    setFilterAnchorEl(event.currentTarget);
    if (filterColumn !== columnKey) {
      setFilterColumn(columnKey);
      setFilterValue('');
    }
    // If same column, keep filterValue
  };
  const handlePopoverClose = () => {
    setFilterAnchorEl(null);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilterValue(e.target.value);
  const handleClearFilter = () => {
    setFilterValue('');
    setFilterColumn(null);
  };

  const handleExportCsv = () => {
    const csv = exportSummaryRowsToCsv(summaryRows, columnLabels, columnKeys);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waste_manifest_summary.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Waste Manifest Summary</title>
      </Head>
      {summaryRows.length === 0 ? (
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Waste Management Report Summary
          </Typography>
          <WmrUpload
            onFileUpload={handleFileUpload}
            error={error}
            uomError={uomError}
          />
        </Box>
      ) : (
        <Box
          sx={{
            width: '100vw',
            px: { xs: 1, sm: 4, md: 8 },
            py: 4,
            overflowX: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              align="center"
              sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TableChartIcon fontSize="large" color="primary" />
              Waste Manifest Summary
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                mt: 1,
              }}
              onClick={handleExportCsv}
              aria-label="Export summary table as CSV"
            >
              Export CSV
            </Button>
          </Box>
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                autoFocus
                size="small"
                label={`Filter ${
                  filterColumn
                    ? columnLabels[columnKeys.indexOf(filterColumn)]
                    : ''
                }`}
                value={filterValue}
                onChange={handleFilterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handlePopoverClose();
                }}
              />
              <IconButton
                onClick={handleClearFilter}
                size="small"
                aria-label="Clear filter"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          </Popover>
          <Box
            sx={{
              width: '100%',
              minWidth: 1200,
              overflowX: 'auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <WmrTable
              summaryRows={filteredRows}
              expanded={expanded}
              setExpanded={setExpanded}
              columnWidths={columnWidths}
              columnLabels={columnLabels}
              columnAlign={columnAlign}
              onHeaderContextMenu={handleHeaderContextMenu}
              onClearFilter={() => {
                setFilterValue('');
                setFilterColumn(null);
              }}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
