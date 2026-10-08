import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { IMPORT_FILE_EXTENSIONS } from '@openjobseekr/domain';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { useImportSpreadsheet } from '../../api/queries/spreadsheet';
import type { ImportResult } from '../../api/types';
import { errorMessage } from '../../lib/errors';
import { formatNumber } from '../../lib/format';
import { useIsMobile } from '../../lib/useIsMobile';
import {
  IMPORT_TEMPLATES,
  importFileProblem,
  MAX_FILE_MEGABYTES,
  splitCellField,
} from './import-file';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (result: ImportResult) => void;
}

/** The cells the API rejected, as "Sheet "Candidatures", cell A3: invalid date". */
function CellErrors({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : [];
  if (fieldErrors.length === 0) return null;
  return (
    <List dense disablePadding aria-label={t('import.cellErrorsLabel')}>
      {fieldErrors.map(({ field, constraints }) => {
        const { sheet, cell } = splitCellField(field);
        return (
          <ListItem key={field} disableGutters>
            <ListItemText
              primary={cell ? t('import.cell', { sheet, cell }) : t('import.sheet', { sheet })}
              secondary={constraints
                .map((constraint) =>
                  t(`import.constraints.${constraint}`, {
                    defaultValue: t('validation.invalid'),
                  }),
                )
                .join(', ')}
            />
          </ListItem>
        );
      })}
    </List>
  );
}

/**
 * Warns before importing: the applications of the file replace the user's applications, its
 * skills are added. Nothing is sent until the user picks a valid file and clicks OK.
 */
export function ImportDialog({ open, onClose, onImported }: ImportDialogProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(null);
  const importSpreadsheet = useImportSpreadsheet();
  const fileProblem = file ? importFileProblem(file) : null;
  const size = formatNumber(MAX_FILE_MEGABYTES, i18n.language);

  const reset = () => {
    setFile(null);
    importSpreadsheet.reset();
  };

  const close = () => {
    // The upload cannot be cancelled once sent: wait for its result.
    if (importSpreadsheet.isPending) return;
    reset();
    onClose();
  };

  const confirm = () => {
    if (!file || fileProblem) return;
    importSpreadsheet.mutate(file, {
      onSuccess: (result) => {
        reset();
        onImported(result);
      },
    });
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>{t('import.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="warning">
            <AlertTitle>{t('import.warningTitle')}</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('import.warningApplications')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('import.warningFollowUps')}
            </Typography>
            <Typography variant="body2">{t('import.warningSkills')}</Typography>
          </Alert>
          <DialogContentText>{t('import.format', { size })}</DialogContentText>
          <Typography variant="body2">
            {t('import.templates')}{' '}
            {IMPORT_TEMPLATES.map(({ format, href }, index) => (
              <span key={format}>
                {index > 0 && ' · '}
                <Link href={href} download>
                  {format}
                </Link>
              </span>
            ))}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              {t('import.chooseFile')}
              <input
                type="file"
                hidden
                accept={IMPORT_FILE_EXTENSIONS.join(',')}
                onChange={(event) => {
                  importSpreadsheet.reset();
                  setFile(event.target.files?.[0] ?? null);
                  // Allows choosing the same file again after fixing it.
                  event.target.value = '';
                }}
              />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {file.name}
              </Typography>
            )}
          </Stack>
          {fileProblem && <Alert severity="error">{t(fileProblem, { size })}</Alert>}
          {importSpreadsheet.error && (
            <Alert severity="error">
              {errorMessage(importSpreadsheet.error, t)}
              <CellErrors error={importSpreadsheet.error} />
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={importSpreadsheet.isPending} autoFocus>
          {t('common.cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!file || fileProblem !== null}
          loading={importSpreadsheet.isPending}
          onClick={confirm}
        >
          {t('import.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
