import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import type { FieldErrors } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import type { Skill } from '../../api/types';
import { errorMessage } from '../../lib/errors';
import { translateFieldError } from '../../lib/field-error';
import {
  SKILL_LIMITS,
  type SkillFormValues,
  skillConstraintToMessage,
  skillFormSchema,
  skillToForm,
  toSkillInput,
} from './skill-form.schema';

type SkillFormOutput = ReturnType<typeof skillFormSchema.parse>;

interface SkillDialogProps {
  /** Skill to edit; undefined to create one. */
  skill?: Skill;
  onClose: () => void;
  /** Throws an ApiError to show server-side errors in the form. */
  onSubmit: (input: ReturnType<typeof toSkillInput>) => Promise<void>;
}

export function SkillDialog({ skill, onClose, onSubmit }: SkillDialogProps) {
  const { t } = useTranslation();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormValues, unknown, SkillFormOutput>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: skillToForm(skill),
    mode: 'onTouched',
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(toSkillInput(values));
    } catch (error) {
      for (const { field, constraints } of error instanceof ApiError ? error.fieldErrors : []) {
        if (field === 'name' || field === 'pattern' || field === 'level') {
          setError(field, { type: 'server', message: skillConstraintToMessage(constraints) });
        }
      }
      setError('root.server', { type: 'server', message: errorMessage(error, t) });
    }
  });

  const rootError = (errors as FieldErrors & { root?: { server?: { message?: string } } }).root
    ?.server;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form noValidate onSubmit={submit}>
        <DialogTitle>{skill ? t('skills.form.editTitle') : t('skills.form.newTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {rootError?.message && <Alert severity="error">{rootError.message}</Alert>}
            <TextField
              {...register('name')}
              label={t('skills.form.name')}
              required
              autoFocus
              error={Boolean(errors.name)}
              helperText={translateFieldError(t, errors.name, SKILL_LIMITS.name)}
              slotProps={{ htmlInput: { maxLength: SKILL_LIMITS.name } }}
            />
            <TextField
              {...register('pattern')}
              label={t('skills.form.pattern')}
              required
              error={Boolean(errors.pattern)}
              helperText={
                translateFieldError(t, errors.pattern, SKILL_LIMITS.pattern) ??
                t('skills.form.patternHelp')
              }
              slotProps={{
                htmlInput: {
                  maxLength: SKILL_LIMITS.pattern,
                  spellCheck: false,
                  style: { fontFamily: 'monospace' },
                },
              }}
            />
            <Controller
              control={control}
              name="level"
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  select
                  label={t('skills.form.level')}
                  error={Boolean(fieldState.error)}
                  helperText={translateFieldError(t, fieldState.error)}
                >
                  <MenuItem value="">
                    <em>{t('skills.form.noLevel')}</em>
                  </MenuItem>
                  {[0, 1, 2, 3, 4, 5].map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('skills.form.cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('skills.form.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
