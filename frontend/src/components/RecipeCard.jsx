import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  Avatar,
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
  const nutrientStyle = {
    calories: { icon: '🔥', bg: 'linear-gradient(135deg, #fff1e6, #ffe8d5)', border: 'rgba(255,138,0,0.35)' },
    protein: { icon: '💪', bg: 'linear-gradient(135deg, #ecf7ff, #e5f2ff)', border: 'rgba(0,122,255,0.2)' },
    carbs: { icon: '🌾', bg: 'linear-gradient(135deg, #f5f8ff, #eef2ff)', border: 'rgba(79,70,229,0.25)' },
    fat: { icon: '🥑', bg: 'linear-gradient(135deg, #eefaf5, #e2f4ed)', border: 'rgba(16,185,129,0.28)' },
    fiber: { icon: '🌿', bg: 'linear-gradient(135deg, #f1fff4, #e9ffef)', border: 'rgba(52,211,153,0.32)' },
  }

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
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: '#d97700',
            letterSpacing: 0.3,
            mb: 1,
            display: 'flex',
            gap: 1,
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <span>Nutrition Facts (per serving)</span>
        </Typography>
        {nutritionEntries.length === 0 ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #fff7ed, #fffaf5)',
              border: '1px dashed rgba(255,138,0,0.28)',
              color: 'text.secondary',
            }}
          >
            Nutrition details not provided for this recipe.
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {nutritionEntries.map(([key, val]) => {
              const style = nutrientStyle[key.toLowerCase()] || {
                icon: key.charAt(0).toUpperCase(),
                bg: 'linear-gradient(135deg, #f5f5f5, #ffffff)',
                border: 'rgba(0,0,0,0.05)',
              }
              const label = `${key.charAt(0).toUpperCase()}${key.slice(1)}`
              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      boxShadow: '0 8px 18px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'rgba(255,138,0,0.14)',
                          color: '#9a3412',
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {style.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#5b3416' }}>
                          {label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          per serving
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', letterSpacing: 0.2 }}>
                      {val}
                    </Typography>
                  </Box>
                </Grid>
              )
            })}
          </Grid>
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
