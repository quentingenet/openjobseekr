import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SpreadsheetFormat } from '@openjobseekr/domain';
import { saveFile } from '../../lib/save-file';
import { api, unwrap, unwrapFile } from '../client';
import { queryKeys } from '../query-keys';

/** Uploads the spreadsheet; applications, statistics and skills all change. */
export function useImportSpreadsheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) =>
      unwrap(
        api.POST('/import', {
          // OpenAPI types a binary field as a string; the browser sends the File as multipart.
          body: { file: file as unknown as string },
          bodySerializer: (body) => {
            const data = new FormData();
            data.append('file', body.file);
            return data;
          },
        }),
      ),
    onSuccess: () =>
      Promise.all(
        [queryKeys.applications, queryKeys.stats, queryKeys.skills].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

/** Downloads the applications and skills as a spreadsheet, named by the API. */
export function useExportSpreadsheet() {
  return useMutation({
    mutationFn: async (format: SpreadsheetFormat) => {
      const file = await unwrapFile(
        api.GET('/export', { params: { query: { format } }, parseAs: 'blob' }),
      );
      saveFile(file.blob, file.fileName ?? `suivi_candidatures.${format}`);
    },
  });
}
