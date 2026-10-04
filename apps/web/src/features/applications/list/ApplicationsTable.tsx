import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Button,
  LinearProgress,
  List,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ApplicationList, ListApplicationsQuery } from '../../../api/types';
import { useIsMobile } from '../../../lib/useIsMobile';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationRow } from './ApplicationRow';
import { PAGE_SIZES, type QueryChanges } from './useApplicationsQuery';

// Hidden on screen but read by screen readers (sort direction of the column).
const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

interface ApplicationsTableProps {
  data: ApplicationList | undefined;
  query: ListApplicationsQuery;
  isLoading: boolean;
  isFetching: boolean;
  hasFilters: boolean;
  onChange: (changes: QueryChanges) => void;
  onClearFilters: () => void;
}

export function ApplicationsTable({
  data,
  query,
  isLoading,
  isFetching,
  hasFilters,
  onChange,
  onClearFilters,
}: ApplicationsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const columns = ['company', 'jobTitle', 'channel', 'status', 'followUp', 'workMode'] as const;
  const isEmpty = !isLoading && data?.items.length === 0;
  // Newest first is the default, so it is not written in the URL.
  const toggleOrder = () => onChange({ order: query.order === 'desc' ? 'asc' : null });

  const emptyState = (
    <>
      <Typography color="text.secondary" gutterBottom>
        {hasFilters ? t('applications.emptyFiltered') : t('applications.empty')}
      </Typography>
      {hasFilters && <Button onClick={onClearFilters}>{t('applications.clearFilters')}</Button>}
    </>
  );

  return (
    <Paper>
      <Box sx={{ height: 4 }}>{isFetching && <LinearProgress />}</Box>
      {isMobile ? (
        <>
          <Box sx={{ px: 1, pt: 0.5 }}>
            <Button
              size="small"
              onClick={toggleOrder}
              startIcon={query.order === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
            >
              {query.order === 'desc'
                ? t('applications.sortNewestFirst')
                : t('applications.sortOldestFirst')}
            </Button>
          </Box>
          <List aria-label={t('applications.tableLabel')} disablePadding>
            {data?.items.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </List>
          {isEmpty && <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>{emptyState}</Box>}
        </>
      ) : (
        <TableContainer>
          <Table aria-label={t('applications.tableLabel')}>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={query.order}>
                  <TableSortLabel active direction={query.order} onClick={toggleOrder}>
                    {t('applications.columns.sentAt')}
                    <Box component="span" sx={visuallyHidden}>
                      {query.order === 'desc'
                        ? t('applications.sortedNewestFirst')
                        : t('applications.sortedOldestFirst')}
                    </Box>
                  </TableSortLabel>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column}>{t(`applications.columns.${column}`)}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} sx={{ py: 6, textAlign: 'center' }}>
                    {emptyState}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={data?.total ?? 0}
        page={Math.floor(query.offset / query.limit)}
        rowsPerPage={query.limit}
        // No room for the page size selector on a phone.
        rowsPerPageOptions={isMobile ? [] : PAGE_SIZES}
        onPageChange={(_event, page) => onChange({ page: page > 0 ? String(page) : null })}
        onRowsPerPageChange={(event) => onChange({ limit: event.target.value, page: null })}
        labelRowsPerPage={t('applications.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) =>
          t('applications.displayedRows', { from, to, count })
        }
      />
    </Paper>
  );
}
