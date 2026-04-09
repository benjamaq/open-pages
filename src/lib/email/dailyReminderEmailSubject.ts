/** Subject lines for V3 daily reminder (cron, send-reminder, notifications, Resend). */
export function dailyReminderEmailSubject(opts: {
  cohortTransactionalShell: boolean
  partnerBrandName?: string | null
}): string {
  if (opts.cohortTransactionalShell) {
    const brand = String(opts.partnerBrandName || '').trim() || 'Study partner'
    return `${brand} study — today's check-in`
  }
  return `Your daily check-in`
}
