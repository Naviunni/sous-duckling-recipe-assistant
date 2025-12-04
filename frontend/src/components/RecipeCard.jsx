import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import { isSavedByName, saveRecipe, removeSavedByName } from '../utils/saved.jsx';

export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const s = await isSavedByName(recipe.name)
        if (active) setSaved(s)
      } catch {
        if (active) setSaved(false)
      }
    })()
    return () => { active = false }
  }, [recipe?.name])

  async function toggleSave() {
    try {
      if (saved) {
        await removeSavedByName(recipe.name)
        setSaved(false)
      } else {
        await saveRecipe(recipe)
        setSaved(true)
      }
    } catch (e) {
      // noop; in a real app, surface a toast
    }
  }

  const nutritionEntries = Object.entries(recipe.nutrition || {}).filter(
    ([, value]) => Boolean(value && String(value).trim())
  )
  const preferredOrder = ['calories', 'protein', 'carbs', 'fat', 'fiber']
  nutritionEntries.sort((a, b) => {
    const ai = preferredOrder.indexOf(a[0].toLowerCase())
    const bi = preferredOrder.indexOf(b[0].toLowerCase())
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 2,
        bgcolor: 'background.paper',
      }}
    >
      {/* Header Row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {recipe.name}
        </Typography>

        <IconButton
          onClick={toggleSave}
          sx={{ color: saved ? 'error.main' : 'text.secondary' }}
          title={saved ? 'Remove from saved' : 'Save recipe'}
        >
          {saved ? (
            <FavoriteIcon sx={{ fontSize: 26 }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: 26 }} />
          )}
        </IconButton>
      </Box>

      {/* Nutrition */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #fff7ed, #fffaf5)',
          border: '1px solid rgba(255,138,0,0.18)',
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97700', letterSpacing: 0.3 }}>
          Nutrition (per serving)
        </Typography>
        {nutritionEntries.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nutrition details not provided for this recipe.
          </Typography>
        ) : (
          nutritionEntries.map(([key, val]) => (
            <Tooltip key={key} title={`Approximate ${key}`}>
              <Chip
                label={`${key.charAt(0).toUpperCase()}${key.slice(1)}: ${val}`}
                sx={{
                  bgcolor: 'rgba(255,138,0,0.08)',
                  color: '#9a3412',
                  borderColor: 'rgba(255,138,0,0.24)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          ))
        )}
      </Box>

      {/* Ingredients + Steps */}
      <Grid container spacing={3}>
        
        {/* INGREDIENTS */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}> Ingredients </Typography>

          <List
            dense
            disablePadding
            sx={{
              bgcolor: 'rgba(255, 195, 77, 0.15)',
              borderRadius: 2,
              py: 1,
              px: 1,
              border: '1px solid rgba(255,138,0,0.2)',
            }}
          >
            {recipe.ingredients?.map((ing, i) => (
              <ListItem
                key={i}
                disableGutters
                sx={{
                  py: 0.7,
                  px: 1,
                  borderBottom:
                    i === recipe.ingredients.length - 1
                      ? 'none'
                      : '1px solid rgba(255,138,0,0.15)',
                }}
              >
                <ListItemText
                  primaryTypographyProps={{
                    sx: {
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.95rem',
                    }
                  }}
                  primary={
                    <>
                      {/* Orange bullet dot */}
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#FF8A00',
                          mr: 1.2,
                          flexShrink: 0
                        }}
                      />

                      {/* Quantity + ingredient text */}
                      <span>
                        {ing.quantity && (
                          <strong style={{ marginRight: '4px', color: '#D97700' }}>
                            {ing.quantity}
                          </strong>
                        )}
                        {ing.name}
                      </span>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Grid>

        {/* STEPS */}
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Steps
          </Typography>

          <Box component="ol" sx={{ pl: 3, m: 0 }}>
            {recipe.steps?.map((step, i) => (
              <Typography
                key={i}
                component="li"
                sx={{ mb: 1.3, lineHeight: 1.45 }}
              >
                {step}
              </Typography>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
