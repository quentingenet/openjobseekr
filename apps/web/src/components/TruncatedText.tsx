import { Tooltip, Typography, type TypographyProps } from '@mui/material';
import { useState } from 'react';

/** Give it a bounded width through `sx` (e.g. `maxWidth`), otherwise nothing is cut. */
type TruncatedTextProps = Omit<TypographyProps, 'children' | 'noWrap'> & {
  children: string;
};

/**
 * Cut with "…" by CSS at the edge of its container; the full text stays in the DOM for screen
 * readers and is shown in a tooltip only when it is actually cut.
 */
export function TruncatedText({ children, sx, ...props }: TruncatedTextProps) {
  const [isTruncated, setIsTruncated] = useState(false);

  // Measured when the pointer or focus arrives, so resizing the window is taken into account.
  const measure = (element: HTMLElement) =>
    setIsTruncated(element.scrollWidth > element.clientWidth);

  return (
    <Tooltip title={isTruncated ? children : ''} placement="top-start" enterDelay={300}>
      <Typography
        noWrap
        onMouseEnter={(event) => measure(event.currentTarget)}
        onFocus={(event) => measure(event.currentTarget)}
        sx={[{ display: 'block' }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {children}
      </Typography>
    </Tooltip>
  );
}
