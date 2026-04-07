/**
 * Writes HTML snapshots for all cohort transactional templates × two brand presets.
 * Run from repo root: `npm run cohort:email-previews` (includes stub Supabase env so the
 * module graph can load; no network calls are made).
 *
 * Output: `tmp/cohort-email-previews/<preset-key>/<template>.html`
 */
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  COHORT_EMAIL_PREVIEW_TEMPLATE_IDS,
  renderCohortEmailPreviewHtml,
} from '../src/lib/cohortEmailPreviewRender'

const root = join(process.cwd(), 'tmp', 'cohort-email-previews')

const PRESETS = [
  { key: 'donotage-sleep', partnerBrandName: 'DoNotAge', productName: 'SureSleep' },
  { key: 'seeking-health-sample', partnerBrandName: 'Seeking Health', productName: 'Optimal Focus' },
] as const

function main() {
  mkdirSync(root, { recursive: true })
  for (const preset of PRESETS) {
    const dir = join(root, preset.key)
    mkdirSync(dir, { recursive: true })
    for (const template of COHORT_EMAIL_PREVIEW_TEMPLATE_IDS) {
      if (template === 'result-ready') {
        for (const resultReadyRewardVariant of ['default', 'claim', 'claimed'] as const) {
          const { html } = renderCohortEmailPreviewHtml(template, {
            partnerBrandName: preset.partnerBrandName,
            productName: preset.productName,
            resultReadyRewardVariant,
          })
          const name = `result-ready__${resultReadyRewardVariant}.html`
          writeFileSync(join(dir, name), html, 'utf8')
        }
        continue
      }
      const { html } = renderCohortEmailPreviewHtml(template, {
        partnerBrandName: preset.partnerBrandName,
        productName: preset.productName,
      })
      writeFileSync(join(dir, `${template}.html`), html, 'utf8')
    }
  }
  console.log('Wrote cohort email previews to', root)
}

main()
