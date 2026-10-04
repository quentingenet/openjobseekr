import { useMediaQuery, useTheme } from '@mui/material';

/** True below the `md` breakpoint (phones and small tablets): lists switch to cards. */
export function useIsMobile(): boolean {
  const theme = useTheme();
  // noSsr: read the media query on the first render, so the desktop layout never flashes.
  return useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
}
