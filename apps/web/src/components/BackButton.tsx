import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

/**
 * Goes back to the previous page, or to `fallback` when the page was opened directly.
 * Without a previous page nor a fallback, there is nowhere to go: nothing is rendered.
 */
export function BackButton({ fallback }: { fallback?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // React Router gives the first entry of the session the key "default".
  const hasPrevious = useLocation().key !== 'default';
  if (!hasPrevious && !fallback) return null;

  return (
    <Tooltip title={t('common.back')}>
      <IconButton
        aria-label={t('common.back')}
        onClick={() => void (hasPrevious || !fallback ? navigate(-1) : navigate(fallback))}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
}
