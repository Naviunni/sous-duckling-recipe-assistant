import React, { useMemo, useState } from 'react';
import ChatUI from './ChatUI';
import RecipeCard from './RecipeCard';
import { ask } from '../utils/api';
import { getSessionId } from '../utils/session';
import { Box, Grid, Typography } from '@mui/material';

export default function Chat() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! Ask me for a recipe, e.g., 'recipe for lasagna'."
    }
  ]);
  const [recipe, setRecipe] = useState(null);

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