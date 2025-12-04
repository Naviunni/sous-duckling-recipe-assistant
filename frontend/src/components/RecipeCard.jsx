import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import { isSavedByName, saveRecipe, removeSavedByName } from '../utils/saved.jsx';

export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSavedByName(recipe.name));
  }, [recipe?.name]);

  function toggleSave() {
    if (saved) {
      removeSavedByName(recipe.name);
      setSaved(false);
    } else {
      saveRecipe(recipe);
      setSaved(true);
    }
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
