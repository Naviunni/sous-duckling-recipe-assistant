import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { styled } from '@mui/material/styles';

const cardData = [
  {
    img: '/pasta.jpg',
    tag: 'American',
    title: 'Creamy Chicken Cajun Pasta',
    description:
      'A little spicy, a touch sweet and incredibly rich chicken pasta is a modern take on chicken Alfredo inspired by the bold flavors of Cajun cuisine, integrating bell peppers, scallions and a heat-forward spice blend into the creamy sauce.',
    authors: [
      { name: '1', avatar: '/static/images/avatar/1.jpg' },
      { name: '2', avatar: '/static/images/avatar/2.jpg' },
    ],
    rating: 4,
    reviews: 76,
  },
  {
    img: '/toast.jpg',
    tag: 'European',
    title: 'Cinnamon French Toast',
    description:
      'Top rated French toast recipe is a make-ahead, feeds-a-crowd brunch dream that yields fluffy, golden French toast with an irresistible streusel topping.',
    authors: [{ name: 'Erica Johns', avatar: '/static/images/avatar/6.jpg' }],
    rating: 5,
    reviews: 54,
  },
  {
    img: '/beans.jpg',
    tag: 'Mediterranean',
    title: 'One-pot Brothy Beans with Herbs & Lemon',
    description:
      'These one-pot vegan brothy beans are super flavourful with herbs, lemon, garlic, chili, well-browned onions and shallots, and miso paste added at the end. A deeply savory pot of beans awaits after 1 ½ hours of mostly inactive simmering time.',
    authors: [{ name: 'Kate Morrison', avatar: '/static/images/avatar/7.jpg' }],
    rating: 3,
    reviews: 32,
  },
  {
    img: '/biriyani.jpg',
    tag: 'Indian',
    title: "Lamb Biriyani",
    description:
      "This classic Indian meat and rice dish is like a party in your mouth! Complex in flavours.",
    authors: [{ name: 'Cindy Baker', avatar: '/static/images/avatar/3.jpg' }],
    rating: 4,
    reviews: 48,
  },
  {
    img: '/fajitas.webp',
    tag: 'Mexican',
    title: 'Sheet Pan Chicken Fajitas',
    description:
      "These protein-packed fajitas cleverly use a foil-lined baking sheet and broiler to make quick work out of dinner. Bonus: easy cleanup!",
    authors: [
      { name: 'Agnes Walker', avatar: '/static/images/avatar/4.jpg' },
      { name: 'Trevor Henderson', avatar: '/static/images/avatar/5.jpg' },
    ],
    rating: 3,
    reviews: 27,
  },
];

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  height: '100%',
  backgroundColor: (theme.vars || theme).palette.background.paper,
  '&:hover': {
    backgroundColor: 'transparent',
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

export function Search() {
  return (
    <FormControl sx={{ width: { xs: '100%', md: '45ch' } }} variant="outlined">
      <OutlinedInput
        size="small"
        id="search"
        placeholder="What would you like to eat today?"
        sx={{ flexGrow: 1 }}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
  );
}

export default function Explore() {
  const [focusedCardIndex, setFocusedCardIndex] = React.useState(null);

  const handleFocus = (index) => {
    setFocusedCardIndex(index);
  };

  const handleBlur = () => {
    setFocusedCardIndex(null);
  };

  const handleClick = () => {
    console.info('You clicked the filter chip.');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
      <div>
        <Typography variant="h1" gutterBottom>
          Chef Curated <font color="#e78310">Must-haves</font>
        </Typography>
        <Typography>Handpicked hits from across the culinary world, trending meals, crowd-pleasers, and fresh ideas to spark your next kitchen adventure. 💛</Typography>
      </div>
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          flexDirection: 'row',
          gap: 1,
          width: { xs: '100%', md: 'fit-content' },
          overflow: 'auto',
        }}
      >
        <Search />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column-reverse', md: 'row' },
          width: '100%',
          justifyContent: 'space-between',
          alignItems: { xs: 'start', md: 'center' },
          gap: 4,
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            flexDirection: 'row',
            gap: 3,
            overflow: 'auto',
          }}
        >
          <Chip onClick={handleClick} size="medium" label="All categories" />
          <Chip
            onClick={handleClick}
            size="medium"
            label="Asian"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
          <Chip
            onClick={handleClick}
            size="medium"
            label="American"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
          <Chip
            onClick={handleClick}
            size="medium"
            label="Mexican"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
          <Chip
            onClick={handleClick}
            size="medium"
            label="Mediterranean"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
          <Chip
            onClick={handleClick}
            size="medium"
            label="Indian"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
          <Chip
            onClick={handleClick}
            size="medium"
            label="European"
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
            }}
          />
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'row',
            gap: 1,
            width: { xs: '100%', md: 'fit-content' },
            overflow: 'auto',
          }}
        >
          <Search />
        </Box>
      </Box>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(0)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 0 ? 'Mui-focused' : ''}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={cardData[0].img}
              sx={{
                aspectRatio: '16 / 9',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />
            <StyledCardContent>
                <Typography gutterBottom variant="caption" component="div">
                    {cardData[0].tag}
                </Typography>
                <Typography gutterBottom variant="h6" component="div">
                    {cardData[0].title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={Number(cardData[0].rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                        {cardData[0].reviews}
                    </Typography>
                </Box>
                <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                    {cardData[0].description}
                </StyledTypography>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(1)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 1 ? 'Mui-focused' : ''}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={cardData[1].img}
              aspect-ratio="16 / 9"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />
            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[1].tag}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {cardData[1].title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={Number(cardData[1].rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                        {cardData[1].reviews}
                    </Typography>
                </Box>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {cardData[1].description}
              </StyledTypography>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(2)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 2 ? 'Mui-focused' : ''}
            sx={{ height: '100%' }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={cardData[2].img}
              sx={{
                height: { sm: 'auto', md: '50%' },
                aspectRatio: { sm: '16 / 9', md: '' },
              }}
            />
            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[2].tag}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {cardData[2].title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={Number(cardData[2].rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                        {cardData[2].reviews}
                    </Typography>
                </Box>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {cardData[2].description}
              </StyledTypography>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(3)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 3 ? 'Mui-focused' : ''}
            sx={{ height: '100%' }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={cardData[3].img}
              sx={{
                height: { sm: 'auto', md: '50%' },
                aspectRatio: { sm: '16 / 9', md: '' },
              }}
            />
            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[3].tag}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {cardData[3].title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={Number(cardData[3].rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                        {cardData[3].reviews}
                    </Typography>
                </Box>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {cardData[3].description}
              </StyledTypography>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(4)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 4 ? 'Mui-focused' : ''}
            sx={{ height: '100%' }}
          >
            <CardMedia
              component="img"
              alt="green iguana"
              image={cardData[4].img}
              sx={{
                height: { sm: 'auto', md: '50%' },
                aspectRatio: { sm: '16 / 9', md: '' },
              }}
            />
            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[4].tag}
              </Typography>
              <Typography gutterBottom variant="h6" component="div">
                {cardData[4].title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={Number(cardData[4].rating)} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                        {cardData[4].reviews}
                    </Typography>
                </Box>
              <StyledTypography variant="body2" color="text.secondary" gutterBottom>
                {cardData[4].description}
              </StyledTypography>
            </StyledCardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}