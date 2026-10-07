import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { File as NodeFile } from 'node:buffer';
import { afterEach } from 'vitest';
import '../i18n';

/**
 * jsdom replaces `FormData` and `File`, but `fetch` and `Request` stay Node's, which cannot
 * serialize jsdom's multipart bodies: file uploads use Node's classes, as a browser would.
 */
const nodeFormData = await new Response('', {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
}).formData();
globalThis.FormData = nodeFormData.constructor as typeof FormData;
globalThis.File = NodeFile as typeof File;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
