import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { useApplications } from '../../api/queries/applications';
import type { ImportResult } from '../../api/types';
import { ErrorState } from '../../components/PageStates';
import { PageTitle } from '../../components/PageTitle';
import { ImportDialog } from '../import/ImportDialog';
import { ApplicationsFilters } from './list/ApplicationsFilters';
import { ApplicationsTable } from './list/ApplicationsTable';
import { useApplicationsQuery } from './list/useApplicationsQuery';
import { useDebouncedSearch } from './list/useDebouncedSearch';

export function ApplicationsPage() {
  const { t } = useTranslation();
  const { query, updateQuery, hasFilters } = useApplicationsQuery();
  const { data, error, isPending, isFetching, refetch } = useApplications(query);
  const search = useDebouncedSearch(query.q ?? '', (q) => updateQuery({ q }));
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState<ImportResult | null>(null);

  // A page past the end (e.g. after deleting the last row of the last page): go to the last page.
  const lastPage = data ? Math.max(0, Math.ceil(data.total / query.limit) - 1) : 0;
  const pageOutOfRange = data !== undefined && !isFetching && query.offset / query.limit > lastPage;
  useEffect(() => {
    if (pageOutOfRange) updateQuery({ page: lastPage > 0 ? String(lastPage) : null });
  }, [pageOutOfRange, lastPage, updateQuery]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <PageTitle>{t('applications.title')}</PageTitle>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportOpen(true)}
          >
            {t('import.button')}
          </Button>
          <Button
            component={RouterLink}
            to="/applications/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            {t('applications.new')}
          </Button>
        </Stack>
      </Stack>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(result) => {
          setImportOpen(false);
          setImported(result);
          // The imported list starts on its first page, without filters.
          search.cancel();
          updateQuery({ status: null, channel: null, overdue: null, q: null, page: null });
        }}
      />
      <Snackbar
        open={imported !== null}
        autoHideDuration={8000}
        onClose={() => setImported(null)}
        message={
          imported &&
          t('import.success', {
            applications: imported.importedApplications,
            skills: imported.addedSkills,
            ignored: imported.ignoredSkills.length,
          })
        }
      />

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
