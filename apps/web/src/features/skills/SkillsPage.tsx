import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Rating,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSkill, useDeleteSkill, useSkillStats, useUpdateSkill } from '../../api/hooks';
import type { SkillStat } from '../../api/types';
import { ErrorState, LoadingState } from '../../components/PageStates';
import { TruncatedText } from '../../components/TruncatedText';
import { errorMessage } from '../../lib/errors';
import { formatNumber, formatPercent } from '../../lib/format';
import { SkillDialog } from './SkillDialog';
import { PageTitle } from '../../components/PageTitle';

type DialogState = { mode: 'create' } | { mode: 'edit'; skill: SkillStat } | null;

export function SkillsPage() {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useSkillStats();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<SkillStat | null>(null);

  if (isPending) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const language = i18n.language;

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <PageTitle>{t('skills.title')}</PageTitle>
          <Typography color="text.secondary">
            {data.postingsAnalyzed > 0
              ? t('skills.subtitle', { count: data.postingsAnalyzed })
              : t('skills.subtitleNone')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ mode: 'create' })}
        >
          {t('skills.add')}
        </Button>
      </Stack>

      <Paper>
        <TableContainer>
          <Table aria-label={t('skills.tableLabel')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('skills.columns.name')}</TableCell>
                <TableCell>{t('skills.columns.pattern')}</TableCell>
                <TableCell align="right">{t('skills.columns.postingCount')}</TableCell>
                <TableCell sx={{ width: '25%' }}>{t('skills.columns.frequency')}</TableCell>
                <TableCell>{t('skills.columns.level')}</TableCell>
                <TableCell align="right">{t('skills.columns.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.skills.map((skill) => (
                <TableRow key={skill.id} hover>
                  <TableCell>
                    <TruncatedText sx={{ fontWeight: 600, maxWidth: { xs: 140, md: 260 } }}>
                      {skill.name}
                    </TruncatedText>
                  </TableCell>
                  <TableCell>
                    <TruncatedText
                      variant="body2"
                      sx={{ fontFamily: 'monospace', maxWidth: { xs: 140, md: 300 } }}
                    >
                      {skill.pattern}
                    </TruncatedText>
                  </TableCell>
                  <TableCell align="right">{formatNumber(skill.postingCount, language)}</TableCell>
                  <TableCell>
                    {skill.frequency === null ? (
                      '—'
                    ) : (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={skill.frequency * 100}
                            aria-label={skill.name}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
                          {formatPercent(skill.frequency, language)}
                        </Typography>
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    {skill.level === null ? (
                      '—'
                    ) : (
                      <Rating value={skill.level} max={5} readOnly size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title={t('skills.edit', { name: skill.name })}>
                      <IconButton
                        aria-label={t('skills.edit', { name: skill.name })}
                        onClick={() => setDialog({ mode: 'edit', skill })}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('skills.delete', { name: skill.name })}>
                      <IconButton
                        aria-label={t('skills.delete', { name: skill.name })}
                        onClick={() => {
                          deleteSkill.reset();
                          setToDelete(skill);
                        }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {data.skills.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}
                  >
                    {t('skills.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {dialog && (
        <SkillDialog
          skill={dialog.mode === 'edit' ? dialog.skill : undefined}
          onClose={() => setDialog(null)}
          onSubmit={async (input) => {
            if (dialog.mode === 'edit') {
              await updateSkill.mutateAsync({ id: dialog.skill.id, input });
            } else {
              await createSkill.mutateAsync(input);
            }
            setDialog(null);
          }}
        />
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>{t('skills.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('skills.deleteMessage', { name: toDelete?.name ?? '' })}
          </DialogContentText>
          {deleteSkill.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(deleteSkill.error, t)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} autoFocus>
            {t('skills.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={deleteSkill.isPending}
            onClick={() => {
              if (toDelete) deleteSkill.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            {t('skills.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
