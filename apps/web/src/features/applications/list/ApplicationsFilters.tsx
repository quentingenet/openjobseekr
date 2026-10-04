import SearchIcon from '@mui/icons-material/Search';
import {
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  SEARCH_MAX_LENGTH,
} from '@openjobseekr/domain';
import { useTranslation } from 'react-i18next';
import type { ListApplicationsQuery } from '../../../api/types';
import type { QueryChanges } from './useApplicationsQuery';

interface ApplicationsFiltersProps {
  query: ListApplicationsQuery;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (changes: QueryChanges) => void;
}

export function ApplicationsFilters({
  query,
  search,
  onSearchChange,
  onChange,
}: ApplicationsFiltersProps) {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' } }}
      >
        <TextField
          label={t('applications.search')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
            htmlInput: { maxLength: SEARCH_MAX_LENGTH },
          }}
          sx={{ flex: 2 }}
        />
        <TextField
          select
          size="small"
          label={t('applications.columns.status')}
          value={query.status ?? ''}
          onChange={(event) => onChange({ status: event.target.value })}
          sx={{ flex: 1 }}
        >
          <MenuItem value="">{t('applications.allStatuses')}</MenuItem>
          {APPLICATION_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`status.${status}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('applications.columns.channel')}
          value={query.channel ?? ''}
          onChange={(event) => onChange({ channel: event.target.value })}
          sx={{ flex: 1 }}
        >
          <MenuItem value="">{t('applications.allChannels')}</MenuItem>
          {APPLICATION_CHANNELS.map((channel) => (
            <MenuItem key={channel} value={channel}>
              {t(`channel.${channel}`)}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(query.overdue)}
              onChange={(event) => onChange({ overdue: event.target.checked ? 'true' : null })}
            />
          }
          label={t('applications.overdueOnly')}
          sx={{ whiteSpace: 'nowrap' }}
        />
      </Stack>
    </Paper>
  );
}
