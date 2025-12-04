import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { listSaved, removeSavedByName } from '../utils/saved.jsx';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import RecipeCard from './RecipeCard.jsx';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  height: '100%',
  backgroundColor: (theme.vars || theme).palette.background.paper,
  '&:hover': {
    cursor: 'pointer',
  },
  '&:focus-visible': {
    outline: '3px solid',
    outlineColor: 'hsla(210, 98%, 48%, 0.5)',
    outlineOffset: '2px',
  },
}));

const StyledCardContent = styled(CardContent)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 16,
  flexGrow: 1,
  '&:last-child': {
    paddingBottom: 16,
  },
});

const StyledTypography = styled(Typography)({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

function Author({ authors }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
      }}
    >
      <Box
        sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}
      >
        <AvatarGroup max={3}>
          {authors.map((author, index) => (
            <Avatar
              key={index}
              alt={author.name}
              src={author.avatar}
              sx={{ width: 24, height: 24 }}
            />
          ))}
        </AvatarGroup>
        <Typography variant="caption">
          {authors.map((author) => author.name).join(', ')}
        </Typography>
      </Box>
      <Typography variant="caption">July 14, 2021</Typography>
    </Box>
  );
}

Author.propTypes = {
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      avatar: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
};


export default function Saved() {
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    
    function refresh() {
        setItems(listSaved());
    }

    useEffect(() => {
        refresh();
    }, []);

    function remove(name) {
        removeSavedByName(name);
        refresh();
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
            <div>
                <Typography variant="h1" gutterBottom>
                Your <font color="#e78310">Cookbook</font>
                </Typography>
                <Typography>A place for your favorite recipes to live, grow, and inspire your next meal. 💛</Typography>
            </div>

            {items.length === 0 ? (
                <Typography color="text.secondary">
                No saved recipes yet. Click the heart on any recipe to save it.
                </Typography>
            ) : (
                <DynamicCards
                items={items}
                onRemove={remove}
                onSelect={setSelected}
                />
            )}

            {/* Modal Viewer */}
            <Dialog
              open={!!selected}
              onClose={() => setSelected(null)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle
                sx={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pr: 1,
                  background: 'linear-gradient(90deg, #FF8A00 0%, #FFC34D 100%)',
                  color: 'white',
                }}
              >
                Saved Recipe

                <IconButton
                  onClick={() => setSelected(null)}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

            <DialogContent dividers>
              {selected && <RecipeCard recipe={selected} />}
            </DialogContent>
          </Dialog>

        </Box>
    );
}

/* ----------------------- ITEMS GRID ---------------------- */
function DynamicCards({ items, onRemove, onSelect }) {
  return (
    <Grid container spacing={2} columns={12}>
      {items.map((recipe, idx) => (
        <Grid size={{ xs: 12, md: 4 }} key={idx}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <StyledCard
                variant="outlined"
                tabIndex={0}
                sx={{ height: '100%' }}
                onClick={() => onSelect(recipe)}
            >
                <StyledCardContent sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                    }}
                >
                    <div>
                        {/* Saved date */}
                        <Typography gutterBottom variant="caption" component="div">
                            {`Saved: ${new Date(recipe.savedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                            })}`}
                        </Typography>

                        {/* Title */}
                        <Typography gutterBottom variant="h6" component="div">
                            {recipe.name}
                        </Typography>

                        {/* Description preview */}
                        <StyledTypography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            {recipe.steps?.[0] || "A delicious saved recipe from your cookbook."}
                        </StyledTypography>
                    </div>
                </StyledCardContent>

                {/* -------- FOOTER -------- */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    gap: 1,
                    }}
                >
                    {/* Chips */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        label={`${recipe.ingredients?.length || 0} ingredients`}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                    />
                    <Chip
                        label={`${recipe.steps?.length || 0} steps`}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                    />
                    </Box>

                    {/* Remove button */}
                    <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(recipe.name);
                    }}
                    sx={{ color: 'error.main' }}
                    >
                    <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
                </StyledCard>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
