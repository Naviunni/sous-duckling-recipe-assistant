import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  TextField
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { getToken, getProfile } from '../utils/auth';
import { saveMyProfile } from '../utils/api';

const DIET_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Kosher', 'Halal', 'Gluten-free', 'Dairy-free', 'Nut-free'
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function Onboarding() {
  const navigate = useNavigate()
  const token = getToken()
  const existing = getProfile()

  const [allergies, setAllergies] = useState([])
  const [dietary, setDietary] = useState([])
  const [dislikes, setDislikes] = useState([])
  const [skill, setSkill] = useState('Beginner')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!token) {
      setError('You need to sign in again.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await saveMyProfile(token, {
        allergies,
        dietary_restrictions: dietary,
        disliked_ingredients: dislikes,
        skill_level: skill,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{ width: '100%', maxWidth: 720, p: 4, borderRadius: 3 }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome, {existing?.name?.split(' ')[0] || 'chef'} 👩‍🍳
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Tell us a bit about your preferences so we can tailor recipes just for you.
        </Typography>

        <Stack spacing={3}>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={allergies}
            onChange={(_, v) => setAllergies(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="filled" color="error" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Allergies"
                placeholder="e.g., peanuts, shellfish"
                variant="outlined"
                margin="normal"
                InputLabelProps={{ ...(params.InputLabelProps || {}), shrink: true }}
                sx={{ '& .MuiInputLabel-outlined': { backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper), px: 0.5 } }}
              />
            )}
          />

          <Autocomplete
            multiple
            options={DIET_OPTIONS}
            value={dietary}
            onChange={(_, v) => setDietary(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" color="primary" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dietary preferences"
                placeholder="Choose any that apply"
                variant="outlined"
                margin="normal"
                InputLabelProps={{ ...(params.InputLabelProps || {}), shrink: true }}
                sx={{ '& .MuiInputLabel-outlined': { backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper), px: 0.5 } }}
              />
            )}
          />

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={dislikes}
            onChange={(_, v) => setDislikes(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Disliked ingredients"
                placeholder="e.g., cilantro, mushrooms"
                variant="outlined"
                margin="normal"
                InputLabelProps={{ ...(params.InputLabelProps || {}), shrink: true }}
                sx={{ '& .MuiInputLabel-outlined': { backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper), px: 0.5 } }}
              />
            )}
          />

          <FormControl fullWidth>
            <InputLabel id="skill-label" sx={{ backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper), px: 0.5 }}>Cooking skill level</InputLabel>
            <Select
              labelId="skill-label"
              label="Cooking skill level"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            >
              {SKILL_LEVELS.map((lvl) => (
                <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#FF8A00', '&:hover': { bgcolor: '#e67a00' }, fontWeight: 600 }}
            >
              {loading ? 'Saving...' : 'Save and continue'}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/', { replace: true })}
            >
              Skip for now
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
