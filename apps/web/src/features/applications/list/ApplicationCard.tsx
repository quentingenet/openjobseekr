import { Box, ListItem, ListItemButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { ApplicationSummary } from '../../../api/types';
import { formatDate } from '../../../lib/format';
import { channelLabel } from '../channel-label';
import { StatusChip } from '../StatusChip';
import { FollowUpCell } from './FollowUpCell';

/** One application on a phone: the whole card is a link to its detail page. */
export function ApplicationCard({ application }: { application: ApplicationSummary }) {
  const { t, i18n } = useTranslation();
  const channel = channelLabel(t, application.channel, application.channelDetail);

  return (
    <ListItem disablePadding divider>
      <ListItemButton
        component={RouterLink}
        to={`/applications/${application.id}`}
        sx={{ display: 'block', py: 1.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700 }}>
              {application.company}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {application.jobTitle}
            </Typography>
          </Box>
          <StatusChip status={application.status} />
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ mt: 1, flexWrap: 'wrap', typography: 'caption', color: 'text.secondary' }}
        >
          <span>
            {t('applications.columns.sentAt')} {formatDate(application.sentAt, i18n.language)}
          </span>
          {channel && <span>{channel}</span>}
          {application.followUpDate && (
            <Stack direction="row" spacing={0.5} component="span">
              <span>{t('applications.columns.followUp')}</span>
              <FollowUpCell date={application.followUpDate} overdue={application.followUpOverdue} />
            </Stack>
          )}
        </Stack>
      </ListItemButton>
    </ListItem>
  );
}
