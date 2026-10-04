import AddIcon from '@mui/icons-material/Add';
import { Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { useApplications } from '../../api/queries/applications';
import { ErrorState } from '../../components/PageStates';
import { PageTitle } from '../../components/PageTitle';
import { ApplicationsFilters } from './list/ApplicationsFilters';
import { ApplicationsTable } from './list/ApplicationsTable';
import { useApplicationsQuery } from './list/useApplicationsQuery';
import { useDebouncedSearch } from './list/useDebouncedSearch';

export function ApplicationsPage() {
  const { t } = useTranslation();
  const { query, updateQuery, hasFilters } = useApplicationsQuery();
  const { data, error, isPending, isFetching, refetch } = useApplications(query);
  const search = useDebouncedSearch(query.q ?? '', (q) => updateQuery({ q }));

  // A page past the end (e.g. after deleting the last row of the last page): go to the last page.
  const lastPage = data ? Math.max(0, Math.ceil(data.total / query.limit) - 1) : 0;
  const pageOutOfRange = data !== undefined && !isFetching && query.offset / query.limit > lastPage;
  useEffect(() => {
    if (pageOutOfRange) updateQuery({ page: lastPage > 0 ? String(lastPage) : null });
  }, [pageOutOfRange, lastPage, updateQuery]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <PageTitle>{t('applications.title')}</PageTitle>
        <Button
          component={RouterLink}
          to="/applications/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          {t('applications.new')}
        </Button>
      </Stack>

      <ApplicationsFilters
        query={query}
        search={search.value}
        onSearchChange={search.onChange}
        onChange={updateQuery}
      />

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <ApplicationsTable
          data={data}
          query={query}
          isLoading={isPending}
          isFetching={isFetching}
          hasFilters={hasFilters}
          onChange={updateQuery}
          onClearFilters={() => {
            search.cancel();
            updateQuery({ status: null, channel: null, overdue: null, q: null });
          }}
        />
      )}
    </Stack>
  );
}
