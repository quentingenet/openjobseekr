import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Alert, Button, Menu, MenuItem, Snackbar } from '@mui/material';
import { SPREADSHEET_FORMATS } from '@openjobseekr/domain';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExportSpreadsheet } from '../../api/queries/spreadsheet';
import { errorMessage } from '../../lib/errors';

/** Downloads the applications and skills in the layout the import reads, in a chosen format. */
export function ExportButton() {
  const { t } = useTranslation();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const exportSpreadsheet = useExportSpreadsheet();

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        loading={exportSpreadsheet.isPending}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t('export.button')}
      </Button>
      <Menu id={menuId} anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {SPREADSHEET_FORMATS.map((format) => (
          <MenuItem
            key={format}
            onClick={() => {
              setAnchor(null);
              exportSpreadsheet.mutate(format);
            }}
          >
            {t(`export.formats.${format}`)}
          </MenuItem>
        ))}
      </Menu>
      <Snackbar open={exportSpreadsheet.isError} onClose={() => exportSpreadsheet.reset()}>
        <Alert severity="error" onClose={() => exportSpreadsheet.reset()}>
          {errorMessage(exportSpreadsheet.error, t)}
        </Alert>
      </Snackbar>
    </>
  );
}
