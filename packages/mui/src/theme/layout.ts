declare module "@mui/material/styles" {
  interface Theme {
    layout: {
      appBarHeight: number;
    };
  }

  interface ThemeOptions {
    layout: {
      appBarHeight: number;
    };
  }
}

const APP_BAR_HEIGHT = 10;

export const layout = {
  appBarHeight: APP_BAR_HEIGHT,
};
