import { Stack, Typography } from '@mui/material';
import { BackButton } from './BackButton';

/** Page heading with the back arrow on its left. */
export function PageTitle({ children, fallback }: { children: string; fallback?: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <BackButton fallback={fallback} />
      <Typography variant="h4" component="h1">
        {children}
      </Typography>
    </Stack>
  );
}
