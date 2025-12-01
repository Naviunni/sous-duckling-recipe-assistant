import React, { useEffect, useState } from 'react';
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
import { getToken } from '../utils/auth';
import { getMyProfile, saveMyProfile } from '../utils/api';

const DIET_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Kosher', 'Halal', 'Gluten-free', 'Dairy-free', 'Nut-free'
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function Profile() {
  const navigate = useNavigate()
  const token = getToken()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [allergies, setAllergies] = useState([])
  const [dietary, setDietary] = useState([])
  const [dislikes, setDislikes] = useState([])
  const [skill, setSkill] = useState('Beginner')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (!token) return
    ;(async () => {
      try {
        const data = await getMyProfile(token)
        if (!active) return
        setEmail(data.email || '')
        setName(data.name || '')
        setAllergies(data.allergies || [])
        setDietary(data.dietary_restrictions || [])
        setDislikes(data.disliked_ingredients || [])
        setSkill(data.skill_level || 'Beginner')
      } catch (err) {
        setError(err?.message || 'Failed to load profile')
      }
    })()
    return () => { active = false }
  }, [token])

  async function onSubmit(e) {
    e.preventDefault()
    if (!token) {
      setError('You need to sign in again.')
      return
    }
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      await saveMyProfile(token, {
        allergies,
        dietary_restrictions: dietary,
        disliked_ingredients: dislikes,
        skill_level: skill,
      })
      setSaved(true)
    } catch (err) {
      setError(err?.message || 'Failed to save profile')
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
      <Paper elevation={4} sx={{ width: '100%', maxWidth: 720, p: 4, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Your Profile
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Update your preferences so recipes fit your taste and constraints.
        </Typography>

        <Stack spacing={3}>
          <TextField label="Email" value={email} InputProps={{ readOnly: true }} />
          <TextField label="Display name" value={name} InputProps={{ readOnly: true }} />

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
              <TextField {...params} label="Allergies" placeholder="e.g., peanuts, shellfish" />
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
              <TextField {...params} label="Dietary preferences" placeholder="Choose any that apply" />
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
              <TextField {...params} label="Disliked ingredients" placeholder="e.g., cilantro, mushrooms" />
            )}
          />

          <FormControl fullWidth>
            <InputLabel id="skill-label">Cooking skill level</InputLabel>
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
          {saved && <Alert severity="success">Preferences saved!</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#FF8A00', '&:hover': { bgcolor: '#e67a00' }, fontWeight: 600 }}
            >
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant="text" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

