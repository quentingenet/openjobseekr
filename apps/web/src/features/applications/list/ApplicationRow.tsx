import { Link, TableCell, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router';
import type { ApplicationChannel, ApplicationStatus, ApplicationSummary } from '../../../api/types';
import { TruncatedText } from '../../../components/TruncatedText';
import { formatDate } from '../../../lib/format';
import { channelLabel } from '../channel-label';
import { StatusChip } from '../StatusChip';
import { FollowUpCell } from './FollowUpCell';

// Long texts are cut with "…" (full text in a tooltip) beyond these widths.
const COMPANY_MAX_WIDTH = { xs: 140, md: 220, xl: 300 };
const JOB_TITLE_MAX_WIDTH = { xs: 180, md: 320, xl: 440 };

export function ApplicationRow({ application }: { application: ApplicationSummary }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const detailPath = `/applications/${application.id}`;

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => void navigate(detailPath)}>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {formatDate(application.sentAt, i18n.language)}
      </TableCell>
      <TableCell>
        {/* A real link keeps the row reachable with the keyboard. */}
        <Link
          component={RouterLink}
          to={detailPath}
          onClick={(event) => event.stopPropagation()}
          underline="hover"
          color="text.primary"
          sx={{ display: 'block' }}
        >
          <TruncatedText component="span" sx={{ fontWeight: 600, maxWidth: COMPANY_MAX_WIDTH }}>
            {application.company}
          </TruncatedText>
        </Link>
      </TableCell>
      <TableCell>
        <TruncatedText sx={{ maxWidth: JOB_TITLE_MAX_WIDTH }}>{application.jobTitle}</TruncatedText>
      </TableCell>
      <TableCell>
        {channelLabel(
          t,
          application.channel as ApplicationChannel | null,
          application.channelDetail,
        ) ?? '—'}
      </TableCell>
      <TableCell>
        <StatusChip status={application.status as ApplicationStatus} />
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <FollowUpCell date={application.followUpDate} overdue={application.followUpOverdue} />
      </TableCell>
      <TableCell>{application.workMode ? t(`workMode.${application.workMode}`) : '—'}</TableCell>
    </TableRow>
  );
}
