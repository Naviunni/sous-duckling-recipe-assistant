import React from "react";
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { dataDisplayCustomizations, feedbackCustomizations, inputsCustomizations, navigationCustomizations, surfacesCustomizations } from './customizations';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';
import Box from '@mui/material/Box';

function AppTheme(props) {
  const { children, disableCustomTheme, themeComponents } = props;
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
          // For more details about CSS variables configuration, see https://mui.com/material-ui/customization/css-theme-variables/configuration/
          cssVariables: {
            // colorSchemeSelector: 'data-mui-color-scheme',
            cssVarPrefix: 'template',
          },
          // colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents,
          },
        });
  }, [disableCustomTheme, themeComponents]);
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <Box style={{ border: '1px solid transparent'}}
      sx={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",

        // ✨ SOFTEN the background
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "rgba(255, 255, 255, 0.74)",
          zIndex: 0
        },

        // Make children appear above overlay
        "& > *": {
          position: "relative",
          zIndex: 1
        }
      }}
    >
      {children}
    </Box>
    </ThemeProvider>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node,
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

export default AppTheme;