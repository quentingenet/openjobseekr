import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
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
import {
  useCreateSkill,
  useDeleteSkill,
  useSkillStats,
  useUpdateSkill,
} from '../../api/queries/skills';
import type { SkillStat } from '../../api/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorState, LoadingState } from '../../components/PageStates';
import { ShareBar } from '../../components/ShareBar';
import { TruncatedText } from '../../components/TruncatedText';
import { formatNumber } from '../../lib/format';
import { useIsMobile } from '../../lib/useIsMobile';
import { SkillDialog } from './SkillDialog';
import { PageTitle } from '../../components/PageTitle';

type DialogState = { mode: 'create' } | { mode: 'edit'; skill: SkillStat } | null;

function SkillActions({
  skill,
  onEdit,
  onDelete,
}: {
  skill: SkillStat;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Tooltip title={t('skills.edit', { name: skill.name })}>
        <IconButton aria-label={t('skills.edit', { name: skill.name })} onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('skills.delete', { name: skill.name })}>
        <IconButton aria-label={t('skills.delete', { name: skill.name })} onClick={onDelete}>
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export function SkillsPage() {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useSkillStats();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<SkillStat | null>(null);
  const isMobile = useIsMobile();

  if (isPending) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const language = i18n.language;
  const actions = (skill: SkillStat) => (
    <SkillActions
      skill={skill}
      onEdit={() => setDialog({ mode: 'edit', skill })}
      onDelete={() => {
        deleteSkill.reset();
        setToDelete(skill);
      }}
    />
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
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
        {isMobile ? (
          <List aria-label={t('skills.tableLabel')} disablePadding>
            {data.skills.map((skill) => (
              <ListItem key={skill.id} divider sx={{ display: 'block', py: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>
                      {skill.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      component="p"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {skill.pattern}
                    </Typography>
                  </Box>
                  <Box sx={{ whiteSpace: 'nowrap' }}>{actions(skill)}</Box>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    {skill.frequency === null ? (
                      '—'
                    ) : (
                      <ShareBar ratio={skill.frequency} label={skill.name} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('skills.postingCountShort', {
                      count: skill.postingCount,
                      formatted: formatNumber(skill.postingCount, language),
                    })}
                  </Typography>
                  {skill.level !== null && (
                    <Rating value={skill.level} max={5} readOnly size="small" />
                  )}
                </Stack>
              </ListItem>
            ))}
            {data.skills.length === 0 && (
              <ListItem sx={{ py: 6, justifyContent: 'center', color: 'text.secondary' }}>
                {t('skills.empty')}
              </ListItem>
            )}
          </List>
        ) : (
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
                    <TableCell align="right">
                      {formatNumber(skill.postingCount, language)}
                    </TableCell>
                    <TableCell>
                      {skill.frequency === null ? (
                        '—'
                      ) : (
                        <ShareBar ratio={skill.frequency} label={skill.name} />
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
                      {actions(skill)}
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
        )}
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

      <ConfirmDialog
        open={toDelete !== null}
        title={t('skills.deleteTitle')}
        message={t('skills.deleteMessage', { name: toDelete?.name ?? '' })}
        confirmLabel={t('skills.confirmDelete')}
        loading={deleteSkill.isPending}
        error={deleteSkill.error}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteSkill.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      />
    </Stack>
  );
}
