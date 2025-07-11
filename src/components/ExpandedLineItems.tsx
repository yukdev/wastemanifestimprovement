import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Fade,
} from '@mui/material';

interface ExpandedLineItemsProps {
  lineItems: Record<string, string>[];
}

interface GroupedWip {
  wip: string;
  lines: Record<string, string>[];
  wasteNames: Set<string>;
  totalWeight: number;
  epaCodes: Set<string>;
  generatorCodes: Set<string>;
  firstLine: string;
}

// Re-implement groupByWipAndSum for grouping by WIP and summing Lbs as integer
function groupByWipAndSum(lineItems: Record<string, string>[]): GroupedWip[] {
  const groups: Record<string, GroupedWip> = {};
  lineItems.forEach((item) => {
    const wip = item['WIP'] || '';
    if (!groups[wip]) {
      groups[wip] = {
        wip,
        lines: [],
        wasteNames: new Set(),
        totalWeight: 0,
        epaCodes: new Set(),
        generatorCodes: new Set(),
        firstLine: item['Ln'],
      };
    }
    groups[wip].lines.push(item);
    if (item['Waste Name']) groups[wip].wasteNames.add(item['Waste Name']);
    if (item['Generator Code'])
      groups[wip].generatorCodes.add(item['Generator Code']);
    if (item['US EPA Codes']) {
      item['US EPA Codes'].split(/[,; ]+/).forEach((code) => {
        if (code) groups[wip].epaCodes.add(code);
      });
    }
    // Only sum if UOM is Lbs or Pounds
    if (
      (item['UOM'] &&
        ['lbs', 'pounds', 'lb'].includes(item['UOM'].toLowerCase())) ||
      (!item['UOM'] && item['Lbs'])
    ) {
      const weight = Math.round(parseFloat(item['Lbs']));
      if (!isNaN(weight)) groups[wip].totalWeight += weight;
    }
  });
  return Object.values(groups);
}

const ExpandedLineItems: React.FC<ExpandedLineItemsProps> = ({ lineItems }) => {
  const grouped = groupByWipAndSum(lineItems);
  grouped.sort((a, b) => {
    const aLine = parseInt(a.firstLine, 10);
    const bLine = parseInt(b.firstLine, 10);
    return aLine - bLine;
  });
  return (
    <Fade in timeout={400}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          boxShadow: '0 2px 12px 0 rgba(25, 118, 210, 0.10)',
          border: '1px solid #e0e0e0',
          background: '#fff',
          mt: 2,
        }}
      >
        <Table size="small" sx={{ background: '#fff' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  color: '#1976d2',
                  background: '#f0f4fa',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                Line #
              </TableCell>
              <TableCell
                sx={{
                  color: '#1976d2',
                  background: '#f0f4fa',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                WIP
              </TableCell>
              <TableCell
                sx={{
                  color: '#1976d2',
                  background: '#f0f4fa',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                Waste Name
              </TableCell>
              <TableCell
                sx={{
                  color: '#1976d2',
                  background: '#f0f4fa',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                Weight (Lbs)
              </TableCell>
              <TableCell
                sx={{
                  color: '#1976d2',
                  background: '#f0f4fa',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                EPA Codes
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grouped.map((group: GroupedWip, idx: number) => (
              <TableRow
                key={`${group.wip}-${idx}`}
                sx={{
                  backgroundColor: idx % 2 === 0 ? '#f7fafd' : '#e8f0fe',
                  '&:hover': { backgroundColor: '#e3f2fd' },
                  color: 'black',
                  transition: 'background 0.2s',
                }}
              >
                <TableCell sx={{ color: 'black' }}>{group.firstLine}</TableCell>
                <TableCell sx={{ color: 'black' }}>{group.wip}</TableCell>
                <TableCell sx={{ color: 'black' }}>
                  {[...group.wasteNames].join(', ')}
                </TableCell>
                <TableCell sx={{ color: 'black' }}>
                  {group.totalWeight}
                </TableCell>
                <TableCell sx={{ color: 'black' }}>
                  {[...group.epaCodes].join(' ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Fade>
  );
};

export default ExpandedLineItems;
