import type { Application } from '../api/types';

export const APPLICATION_ID = '6c3f4d2e-0000-4000-8000-000000000001';

export const application: Application = {
  id: APPLICATION_ID,
  sentAt: '2026-10-01',
  company: 'Acme',
  jobTitle: 'Backend developer',
  location: 'Lyon',
  response: null,
  resources: null,
  channel: 'LINKEDIN',
  channelDetail: null,
  status: 'SENT',
  contact: 'Marie Martin',
  followUpDate: '2026-10-08',
  followUpOverride: null,
  followUpOverdue: true,
  workMode: 'HYBRID',
  remoteRhythm: null,
  salaryRange: null,
  cvVersion: null,
  stack: null,
  recruitmentProcess: null,
  notes: null,
  jobPostingText: 'We are hiring.\nJoin us!',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
};
