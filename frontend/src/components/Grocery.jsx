import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

function createData(name, quantity) {
  return { name, quantity };
}

const rows = [
  createData('Fresh Green Kale Bunch', '1 bunch'),
  createData('Canned Crab Meat', '1 can (6 oz)'),
  createData('Whole galic clove', '5 cloves'),
  createData('Grated Parmesan Cheese', '1 cup'),
];

export default function Grocery() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
        <div>
            <Typography variant="h1" gutterBottom>
                Chef's <font color="#e78310">Market Run</font>
            </Typography>
            <Typography>I gathered all the ingredients you picked. Let's grab these goodies and whip up something delicious! 💛</Typography>
        </div>

        <Box sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',   // centers horizontally
                mt: 4,
            }}
        >
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                <TableContainer component={Paper}>
                <Table sx={{ minWidth: 450 }} aria-label="simple table">
                    <TableHead>
                    <TableRow sx={{
                        background: 'linear-gradient(90deg, #FF8A00 0%, #FFC34D 100%)',
                        }}
                    >
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ingredients</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quantity</TableCell>
                    </TableRow>
                    </TableHead>

                    <TableBody>
                    {rows.map((row) => (
                        <TableRow
                        key={row.name}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                        <TableCell component="th" scope="row">
                            {row.name}
                        </TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Box>
        </Box>
    </Box>
  );
}