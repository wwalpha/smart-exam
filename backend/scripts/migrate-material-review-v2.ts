import { writeFile } from 'node:fs/promises';
import { readSnapshot, planMigration, applyMigration, verifyMigration } from '../src/services/materialReviewMigration/index';

const args = process.argv.slice(2);
const value = (name: string) => args[args.indexOf(name) + 1];
const allowed = new Set(['--dry-run', '--apply', '--maintenance-confirmed', '--allow-remote-apply', '--backup-reference', '--report']);
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
  if (['--backup-reference', '--report'].includes(args[i])) {
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value: ${args[i]}`);
    i++;
  }
}
const apply = args.includes('--apply');
if (apply && args.includes('--dry-run')) throw new Error('Choose --dry-run or --apply');
if (apply && !args.includes('--maintenance-confirmed')) throw new Error('--apply requires --maintenance-confirmed');
const endpoint = process.env.AWS_ENDPOINT_URL;
const local = endpoint && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(endpoint).hostname);
if (apply && !local && (!args.includes('--allow-remote-apply') || !args.includes('--backup-reference'))) {
  throw new Error('Remote apply requires --allow-remote-apply and --backup-reference');
}
const reportPath = args.includes('--report') ? value('--report') : `material-review-v2-${Date.now()}.json`;
const before = await readSnapshot();
const plan = planMigration(before);
const report = {
  mode: apply ? 'apply' : 'dry-run', endpoint: endpoint ?? 'AWS', backupReference: args.includes('--backup-reference') ? value('--backup-reference') : undefined,
  plan, beforeTotal: before.questions.reduce((sum, q) => sum + (q.reviewCount ?? 0), 0),
  processed: 0, afterTotal: undefined as number | undefined, violations: [] as ReturnType<typeof verifyMigration>,
  error: undefined as string | undefined,
};
const save = () => writeFile(reportPath, JSON.stringify(report, (_key, item) => item instanceof Set ? [...item] : item, 2) + '\n');
await save();
try {
  if (apply) {
    report.processed = await applyMigration(before, plan);
    const after = await readSnapshot();
    report.afterTotal = after.questions.reduce((sum, q) => sum + (q.reviewCount ?? 0), 0);
    report.violations = verifyMigration(after);
    const afterPlan = planMigration(after);
    for (const row of plan.rows) {
      const actual = after.questions.find((q) => q.questionId === row.questionId);
      if (actual?.reviewCount !== row.reviewCount || [...actual?.countedExamIds ?? []].sort().join('\n') !== [...row.countedExamIds].sort().join('\n')) {
        report.violations.push({ code: 'COUNTER_COMPARISON_MISMATCH', questionId: row.questionId });
      }
      if (!row.alreadyMigrated && afterPlan.rows.find((q) => q.questionId === row.questionId)?.historyCount !== row.historyCount) {
        report.violations.push({ code: 'HISTORY_CHANGED_DURING_MIGRATION', questionId: row.questionId });
      }
    }
    if (report.violations.length) throw new Error('Post-migration verification failed');
  }
} catch (error) {
  report.error = String(error);
  process.exitCode = 1;
  if (apply) {
    try {
      const partial = await readSnapshot();
      report.processed = partial.questions.filter((q) => q.reviewPolicyVersion === 2 && before.questions.some((old) => old.questionId === q.questionId && old.reviewPolicyVersion !== 2)).length;
      report.afterTotal = partial.questions.reduce((sum, q) => sum + (q.reviewCount ?? 0), 0);
      report.violations = verifyMigration(partial);
    } catch (readError) { report.error += `; partial-state read failed: ${String(readError)}`; }
  }
} finally {
  await save();
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
}
