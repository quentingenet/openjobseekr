import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../client';
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
