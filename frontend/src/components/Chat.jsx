import React, { useMemo, useState, useEffect } from 'react';
import ChatUI from './ChatUI';
import RecipeCard from './RecipeCard';
import { ask } from '../utils/api';
import { getSessionId } from '../utils/session';
import { Box, Grid, Typography, Chip, Stack } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { getMyProfile } from '../utils/api';

export default function Chat() {
  const sessionId = useMemo(() => getSessionId(), []);
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! Ask me for a recipe, e.g., 'recipe for lasagna'."
    }
  ]);
  const [recipe, setRecipe] = useState(null);
  const [constraints, setConstraints] = useState({ dietary: [], allergies: [], dislikes: [], skill: null })

  // If navigated with a preloaded recipe (from Saved), show it immediately
  useEffect(() => {
    const r = location.state?.recipe
    if (r) setRecipe(r)
  }, [location.state])

  // Load user constraints for badges
  useEffect(() => {
    const token = getToken()
    let active = true
    if (!token) return
    ;(async () => {
      try {
        const p = await getMyProfile(token)
        if (!active) return
        setConstraints({
          dietary: p?.dietary_restrictions || [],
          allergies: p?.allergies || [],
          dislikes: p?.disliked_ingredients || [],
          skill: p?.skill_level || null,
        })
      } catch {
        if (active) setConstraints({ dietary: [], allergies: [], dislikes: [], skill: null })
      }
    })()
    return () => { active = false }
  }, [])

  async function sendMessage(text) {
    const msg = text.trim();
    if (!msg) return;

    setMessages(m => [...m, { role: 'user', text: msg }]);

    try {
      const data = await ask(msg, sessionId);
      setMessages(m => [...m, { role: 'assistant', text: data.reply }]);

      if (data.recipe) setRecipe(data.recipe);
    } catch (err) {
      setMessages(m => [
        ...m,
        { role: 'assistant', text: 'Error contacting backend.' }
      ]);
    }
  }

  return (
    <Box sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', mt: 2 }}>
      
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" gutterBottom>
          Chat with <span style={{ color: '#e78310' }}>Sous Duckling</span>
        </Typography>
        <Typography>
          Ask away, chef! I've got recipes to share, ingredients to adjust,
          and culinary magic to help you whip up something delicious. 💛
        </Typography>
      </Box>

      {/* Active constraints badges */}
      {(constraints.dietary.length || constraints.allergies.length || constraints.dislikes.length || constraints.skill) ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Active constraints</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {constraints.skill && (
              <Chip size="small" label={`Skill: ${constraints.skill}`} color="default" variant="outlined" />
            )}
            {constraints.dietary.slice(0, 6).map((d, i) => (
              <Chip key={`diet-${i}`} size="small" label={d} color="primary" variant="outlined" />
            ))}
            {constraints.allergies.slice(0, 6).map((a, i) => (
              <Chip key={`all-${i}`} size="small" label={a} color="error" variant="filled" />
            ))}
            {constraints.dislikes.slice(0, 6).map((d, i) => (
              <Chip key={`dis-${i}`} size="small" label={d} color="warning" variant="outlined" />
            ))}
            {Math.max(0,
              (constraints.dietary.length - 6) +
              (constraints.allergies.length - 6) +
              (constraints.dislikes.length - 6)
            ) > 0 && (
              <Chip size="small" label={"+ more"} variant="outlined" />
            )}
          </Stack>
        </Box>
      ) : null}

      <Grid container sx={{ width: '100%' }} spacing={2}>
        {/* LEFT: Chat */}
        <Grid item sx={{
            minWidth: 0,
            flexBasis: { xs: '100%', md: '38%' },
            maxWidth: { xs: '100%', md: '38%' }
          }}>
          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(90deg, #FF8A00 0%, #FFC34D 100%)',
                color: 'white',
                px: 2,
                py: 1.2,
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: '12px 12px 0 0',
                letterSpacing: '0.5px',
              }}
            >
              Quack & Cook Chat
            </Box>

            <ChatUI messages={messages} onSend={sendMessage} />
          </Box>
        </Grid>

        {/* RIGHT: Recipe */}
        <Grid item sx={{
            minWidth: 0,
            flexBasis: { xs: '100%', md: '60%' },
            maxWidth: { xs: '100%', md: '60%' }
          }}>
          {recipe && <RecipeCard recipe={recipe} />}
        </Grid>

      </Grid>
    </Box>
  );
}
