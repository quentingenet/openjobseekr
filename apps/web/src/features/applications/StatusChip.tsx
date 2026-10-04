import { Chip, type ChipProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ApplicationStatus } from '../../api/types';

const colorByStatus: Record<ApplicationStatus, ChipProps['color']> = {
  SENT: 'default',
  RESPONSE_RECEIVED: 'info',
  HR_INTERVIEW: 'primary',
  TECHNICAL_INTERVIEW: 'secondary',
  OFFER: 'success',
  REJECTED: 'error',
  NO_RESPONSE: 'warning',
};

export function StatusChip({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  return <Chip size="small" color={colorByStatus[status]} label={t(`status.${status}`)} />;
}
