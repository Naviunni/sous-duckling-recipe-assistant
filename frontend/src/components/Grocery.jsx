import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';

import { getToken } from '../utils/auth.jsx';
import { getMyGrocery, deleteMyGrocery, removeGroceryRecipe, updateGroceryItem } from '../utils/api.jsx';
import TextField from '@mui/material/TextField';
import SaveIcon from '@mui/icons-material/Save';

export default function Grocery() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState(location.state?.items || []);
  const [recipeNames, setRecipeNames] = useState(location.state?.recipes || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipesRaw, setRecipesRaw] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState({ quantity: '', unit: '', aisle: '' });

  // If navigated with a fresh list, prefer it
  useEffect(() => {
    if (location.state?.items) {
      setItems(location.state.items || []);
      setRecipeNames(location.state.recipes || []);
    }
  }, [location.state]);

  // Load saved list if we didn't arrive with one
  useEffect(() => {
    if (items.length > 0) return;
    const token = getToken();
    if (!token) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getMyGrocery(token);
        if (!active) return;
        setItems(data.aggregated?.items || []);
        setRecipeNames(data.aggregated?.recipes || []);
        setRecipesRaw(data.recipes || []);
      } catch (e) {
        if (active) setError('Could not load your grocery list.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; }
  }, [items.length]);

  const grouped = useMemo(() => {
    const out = {};
    for (const item of items) {
      const aisle = item.aisle || 'Other';
      out[aisle] = out[aisle] || [];
      out[aisle].push(item);
    }
    return out;
  }, [items]);

  const hasItems = items.length > 0;

  async function removeItem(name) {
    const token = getToken();
    if (!token) return;
    try {
      const data = await updateGroceryItem(token, { key: name.toLowerCase(), remove: true });
      setItems(data.aggregated?.items || []);
      setRecipeNames(data.aggregated?.recipes || []);
      setRecipesRaw(data.recipes || []);
    } catch (e) {
      setError('Failed to update grocery list.');
    }
  }

  async function clearList() {
    setItems([]);
    setRecipeNames([]);
    const token = getToken();
    if (!token) return;
    try {
      await deleteMyGrocery(token);
    } catch (e) {
      setError('Failed to clear grocery list.');
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
      <div>
        <Typography variant="h1" gutterBottom>
          Chef's <font color="#e78310">Market Run</font>
        </Typography>
        <Typography>
          I gathered all the ingredients you picked. Let's grab these goodies and whip up something delicious! 💛
        </Typography>
        {recipeNames.length > 0 && (
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Generated from: {recipeNames.join(', ')}
          </Typography>
        )}
        {hasItems && (
          <Button variant="text" color="error" sx={{ mt: 1 }} onClick={clearList}>
            Clear list
          </Button>
        )}
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {!hasItems && (
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography sx={{ mb: 2 }}>No grocery list yet.</Typography>
          <Typography variant="body2" color="text.secondary">
            Go to any recipe, click “Create grocery list,” and you’ll see your items here.
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/chat')}>
            Back to chat
          </Button>
        </Paper>
      )}

      {hasItems && Object.keys(grouped).map((aisle) => (
        <Box key={aisle} sx={{ width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={aisle} color="warning" variant="outlined" size="small" />
            <span>{aisle}</span>
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table sx={{ minWidth: 450 }} aria-label={`${aisle} table`}>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(90deg, #FF8A00 0%, #FFC34D 100%)',
                  }}
                >
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ingredients</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Quantity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Recipes</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {grouped[aisle].map((row, idx) => {
                  const isEditing = editingKey === row.key;
                  return (
                    <TableRow
                      key={`${row.name}-${idx}`}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => removeItem(row.key || row.name)} title="Remove from list">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {isEditing ? (
                          <TextField
                            size="small"
                            label="Item"
                            value={row.name}
                            disabled
                          />
                        ) : (
                          row.name
                        )}
                        {row.unknown ? (
                          <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                            Quantity needs a quick check
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              label="Qty"
                              value={editDraft.quantity}
                              onChange={(e) => setEditDraft((d) => ({ ...d, quantity: e.target.value }))}
                            />
                            <TextField
                              size="small"
                              label="Unit"
                              value={editDraft.unit}
                              onChange={(e) => setEditDraft((d) => ({ ...d, unit: e.target.value }))}
                            />
                            <TextField
                              size="small"
                              label="Aisle"
                              value={editDraft.aisle}
                              onChange={(e) => setEditDraft((d) => ({ ...d, aisle: e.target.value }))}
                            />
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={async () => {
                                const token = getToken();
                                if (!token) return;
                                try {
                                  const data = await updateGroceryItem(token, {
                                    key: row.key || row.name.toLowerCase(),
                                    quantity: editDraft.quantity,
                                    unit: editDraft.unit,
                                    aisle: editDraft.aisle,
                                  });
                                  setItems(data.aggregated?.items || []);
                                  setRecipeNames(data.aggregated?.recipes || []);
                                  setRecipesRaw(data.recipes || []);
                                  setEditingKey(null);
                                  setEditDraft({ quantity: '', unit: '', aisle: '' });
                                } catch {
                                  setError('Failed to save item changes.');
                                }
                              }}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          [row.quantity, row.unit].filter(Boolean).join(' ') || '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {(row.recipes || []).join(', ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {!isEditing && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              setEditingKey(row.key || row.name);
                              setEditDraft({
                                quantity: row.quantity || '',
                                unit: row.unit || '',
                                aisle: row.aisle || '',
                              });
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {recipeNames.length > 0 && (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Recipes in this list</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {recipeNames.map((r) => (
              <Chip
                key={r}
                label={r}
                onDelete={async () => {
                  const token = getToken();
                  if (!token) return;
                  try {
                    const data = await removeGroceryRecipe(token, r);
                    setItems(data.aggregated?.items || []);
                    setRecipeNames(data.aggregated?.recipes || []);
                    setRecipesRaw(data.recipes || []);
                  } catch {
                    setError('Failed to remove recipe.');
                  }
                }}
                deleteIcon={<DeleteIcon />}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
