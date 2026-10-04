import { Tooltip, Typography, type TypographyProps } from '@mui/material';
import { useState } from 'react';

/** Give it a bounded width through `sx` (e.g. `maxWidth`), otherwise nothing is cut. */
type TruncatedTextProps = Omit<TypographyProps, 'children' | 'noWrap'> & {
  children: string;
};

/**
 * Single-line text cut with an ellipsis by CSS where its container ends (no character count,
 * so it adapts to the column width). The full text stays in the DOM for screen readers and is
 * shown in a tooltip on hover or focus, only when it is actually cut.
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
