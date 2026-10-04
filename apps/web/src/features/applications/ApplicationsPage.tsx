import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Link,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import { useApplications } from '../../api/hooks';
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUSES,
  type ApplicationChannel,
  type ApplicationStatus,
  type ListApplicationsQuery,
} from '../../api/types';
import { ErrorState } from '../../components/PageStates';
import { TruncatedText } from '../../components/TruncatedText';
import { formatDate } from '../../lib/format';
import { StatusChip } from './StatusChip';

const PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
// Long texts are cut with "…" (full text in a tooltip) beyond these widths.
const COMPANY_MAX_WIDTH = { xs: 140, md: 220, xl: 300 };
const JOB_TITLE_MAX_WIDTH = { xs: 180, md: 320, xl: 440 };

function isOneOf<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && (values as readonly string[]).includes(value);
}

/** Filters and pagination live in the URL: shareable, and kept by the back button. */
function useListQuery(): [ListApplicationsQuery, (changes: Record<string, string | null>) => void] {
  const [params, setParams] = useSearchParams();
  const status = params.get('status');
  const channel = params.get('channel');
  const limit = Number(params.get('limit'));
  const page = Number(params.get('page'));
  const pageSize = PAGE_SIZES.includes(limit) ? limit : DEFAULT_PAGE_SIZE;

  const query: ListApplicationsQuery = {
    status: isOneOf(APPLICATION_STATUSES, status) ? status : undefined,
    channel: isOneOf(APPLICATION_CHANNELS, channel) ? channel : undefined,
    overdue: params.get('overdue') === 'true' || undefined,
    q: params.get('q') ?? undefined,
    limit: pageSize,
    offset: Number.isInteger(page) && page > 0 ? page * pageSize : 0,
  };

  const update = (changes: Record<string, string | null>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        // Any filter change goes back to the first page.
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  return [query, update];
}

export function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, updateQuery] = useListQuery();
  const { data, error, isPending, isFetching, refetch } = useApplications(query);

  // The search field updates the URL after a short pause, not on every key stroke.
  const [search, setSearch] = useState(query.q ?? '');
  const [syncedQ, setSyncedQ] = useState(query.q);
  if (query.q !== syncedQ) {
    // The URL changed elsewhere (nav link, back button, clear filters): follow it.
    setSyncedQ(query.q);
    setSearch(query.q ?? '');
  }
  // The timer must use the latest `updateQuery`, or it would restore filters changed meanwhile.
  const updateQueryRef = useRef(updateQuery);
  useEffect(() => {
    updateQueryRef.current = updateQuery;
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const onSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => updateQueryRef.current({ q: value.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
  };

  // A page past the end (e.g. after deleting the last row of the last page): go to the last page.
  const lastPage = data ? Math.max(0, Math.ceil(data.total / query.limit) - 1) : 0;
  const pageOutOfRange = data !== undefined && !isFetching && query.offset / query.limit > lastPage;
  useEffect(() => {
    if (pageOutOfRange) updateQueryRef.current({ page: lastPage > 0 ? String(lastPage) : null });
  }, [pageOutOfRange, lastPage]);

  const hasFilters = Boolean(query.status || query.channel || query.overdue || query.q);
  const language = i18n.language;

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {t('applications.title')}
        </Typography>
        <Button
          component={RouterLink}
          to="/applications/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          {t('applications.new')}
        </Button>
      </Stack>

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
              htmlInput: { maxLength: 100 },
            }}
            sx={{ flex: 2 }}
          />
          <TextField
            select
            size="small"
            label={t('applications.columns.status')}
            value={query.status ?? ''}
            onChange={(event) => updateQuery({ status: event.target.value })}
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
            onChange={(event) => updateQuery({ channel: event.target.value })}
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
                onChange={(event) => updateQuery({ overdue: event.target.checked ? 'true' : null })}
              />
            }
            label={t('applications.overdueOnly')}
            sx={{ whiteSpace: 'nowrap' }}
          />
        </Stack>
      </Paper>

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Paper>
          {/* Thin progress bar while a new page or filter is loading. */}
          <Box sx={{ height: 4 }}>{isFetching && <LinearProgress />}</Box>
          <TableContainer>
            <Table aria-label={t('applications.tableLabel')}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('applications.columns.sentAt')}</TableCell>
                  <TableCell>{t('applications.columns.company')}</TableCell>
                  <TableCell>{t('applications.columns.jobTitle')}</TableCell>
                  <TableCell>{t('applications.columns.channel')}</TableCell>
                  <TableCell>{t('applications.columns.status')}</TableCell>
                  <TableCell>{t('applications.columns.followUp')}</TableCell>
                  <TableCell>{t('applications.columns.workMode')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.items.map((application) => (
                  <TableRow
                    key={application.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => void navigate(`/applications/${application.id}`)}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(application.sentAt, language)}
                    </TableCell>
                    <TableCell>
                      {/* A real link keeps the row reachable with the keyboard. */}
                      <Link
                        component={RouterLink}
                        to={`/applications/${application.id}`}
                        onClick={(event) => event.stopPropagation()}
                        underline="hover"
                        color="text.primary"
                        sx={{ display: 'block' }}
                      >
                        <TruncatedText
                          component="span"
                          sx={{ fontWeight: 600, maxWidth: COMPANY_MAX_WIDTH }}
                        >
                          {application.company}
                        </TruncatedText>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TruncatedText sx={{ maxWidth: JOB_TITLE_MAX_WIDTH }}>
                        {application.jobTitle}
                      </TruncatedText>
                    </TableCell>
                    <TableCell>
                      {application.channel
                        ? t(`channel.${application.channel as ApplicationChannel}`)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={application.status as ApplicationStatus} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {application.followUpDate ? (
                        application.followUpOverdue ? (
                          <Tooltip
                            title={t('applications.overdueSince', {
                              date: formatDate(application.followUpDate, language),
                            })}
                          >
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ color: 'error.main', alignItems: 'center' }}
                            >
                              <WarningAmberIcon fontSize="small" aria-hidden />
                              <span>{formatDate(application.followUpDate, language)}</span>
                            </Stack>
                          </Tooltip>
                        ) : (
                          formatDate(application.followUpDate, language)
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {application.workMode ? t(`workMode.${application.workMode}`) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {!isPending && data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" gutterBottom>
                        {hasFilters ? t('applications.emptyFiltered') : t('applications.empty')}
                      </Typography>
                      {hasFilters && (
                        <Button
                          onClick={() => {
                            clearTimeout(searchTimer.current);
                            updateQuery({ status: null, channel: null, overdue: null, q: null });
                          }}
                        >
                          {t('applications.clearFilters')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={Math.floor(query.offset / query.limit)}
            rowsPerPage={query.limit}
            rowsPerPageOptions={PAGE_SIZES}
            onPageChange={(_event, page) => updateQuery({ page: page > 0 ? String(page) : null })}
            onRowsPerPageChange={(event) => updateQuery({ limit: event.target.value, page: null })}
            labelRowsPerPage={t('applications.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) =>
              t('applications.displayedRows', { from, to, count })
            }
          />
        </Paper>
      )}
    </Stack>
  );
}
