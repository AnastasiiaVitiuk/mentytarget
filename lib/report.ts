/**
 * Client-side full-report builder.
 *
 * Aggregates every prioritized target with its known drugs (Open Targets) and
 * supporting literature (Europe PMC), then renders a self-contained, printable
 * HTML document. This works without the FastAPI backend so the exported report
 * always covers ALL targets — not just the on-screen summary — and includes the
 * literature each section was sourced from.
 */

import type { ScoreResponse, RankedTarget } from "./api"
import { fetchKnownDrugs, stageLabel, type KnownDrug } from "./opentargets"
import { fetchTargetLiterature, type LiteratureArticle } from "./literature"

export interface TargetReportSection {
  target: RankedTarget
  drugs: KnownDrug[]
  literature: LiteratureArticle[]
}

/** Fetches drugs + literature for every target, tolerating partial failures. */
export async function buildReportData(
  result: ScoreResponse,
): Promise<TargetReportSection[]> {
  const sorted = [...result.targets].sort((a, b) => b.score - a.score)

  return Promise.all(
    sorted.map(async (target) => {
      const [drugs, literature] = await Promise.all([
        fetchKnownDrugs(target.symbol, target.target_id)
          .then((r) => r.drugs)
          .catch(() => [] as KnownDrug[]),
        fetchTargetLiterature(target.symbol, result.disease_label, 6).catch(
          () => [] as LiteratureArticle[],
        ),
      ])
      return { target, drugs, literature }
    }),
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Renders the aggregated data into a standalone HTML document string. */
export function generateReportHtml(
  result: ScoreResponse,
  sections: TargetReportSection[],
): string {
  const generatedOn = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const totalDrugs = sections.reduce((sum, s) => sum + s.drugs.length, 0)
  const totalRefs = sections.reduce((sum, s) => sum + s.literature.length, 0)

  const sectionsHtml = sections
    .map((s, i) => {
      const t = s.target
      const evidence = t.evidence
        .map(
          (e) =>
            `<span class="tag">${escapeHtml(e.datatype.replace(/_/g, " "))}</span>`,
        )
        .join(" ")

      const drugsHtml =
        s.drugs.length > 0
          ? `<table class="drugs">
              <thead><tr><th>Compound</th><th>Stage</th><th>Mechanism of action</th></tr></thead>
              <tbody>
                ${s.drugs
                  .map(
                    (d) => `<tr>
                      <td>${escapeHtml(d.prefName)}</td>
                      <td>${escapeHtml(stageLabel(d.stage))}</td>
                      <td>${escapeHtml(
                        d.mechanismOfAction ?? d.drugType ?? "—",
                      )}</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>`
          : `<p class="muted">No known drugs recorded — potential novel opportunity.</p>`

      const litHtml =
        s.literature.length > 0
          ? `<ol class="refs">
              ${s.literature
                .map(
                  (l) => `<li>
                    <a href="${escapeHtml(l.url)}">${escapeHtml(l.title)}</a>
                    ${l.journal ? `<span class="muted"> — ${escapeHtml(l.journal)}</span>` : ""}
                    ${l.year ? `<span class="muted"> (${escapeHtml(l.year)})</span>` : ""}
                    ${l.pmid ? `<span class="muted"> · PMID ${escapeHtml(l.pmid)}</span>` : ""}
                  </li>`,
                )
                .join("")}
            </ol>`
          : `<p class="muted">No indexed publications found for this target.</p>`

      return `<section class="target">
        <h3>${i + 1}. ${escapeHtml(t.symbol)} <span class="muted">— ${escapeHtml(t.name)}</span></h3>
        <p class="meta">Score ${t.score.toFixed(2)} · Tractability ${t.tractability.toFixed(2)} · ${evidence}</p>
        <p>${escapeHtml(t.explanation)}</p>
        <h4>Suggested drugs (${s.drugs.length})</h4>
        ${drugsHtml}
        <h4>Supporting literature (${s.literature.length})</h4>
        ${litHtml}
      </section>`
    })
    .join("\n")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MentyTarget Report — ${escapeHtml(result.disease_label)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1626; line-height: 1.55; margin: 0; padding: 40px; max-width: 900px; margin-inline: auto; background: #faf9fc; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 32px 0 12px; border-bottom: 2px solid #6d28d9; padding-bottom: 6px; color: #4c1d95; }
  h3 { font-size: 16px; margin: 24px 0 4px; }
  h4 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #6b21a8; margin: 16px 0 6px; }
  p { margin: 6px 0; font-size: 14px; }
  .muted { color: #6b6577; font-weight: 400; }
  .meta { font-size: 12px; color: #6b6577; }
  .lede { font-size: 14px; }
  .tag { display: inline-block; background: #ede9fe; color: #5b21b6; border-radius: 999px; padding: 1px 8px; font-size: 11px; margin-right: 2px; }
  .stats { display: flex; gap: 24px; margin: 16px 0; flex-wrap: wrap; }
  .stat { background: #fff; border: 1px solid #e7e3ef; border-radius: 10px; padding: 12px 18px; }
  .stat strong { display: block; font-size: 22px; color: #4c1d95; }
  .stat span { font-size: 12px; color: #6b6577; }
  .target { background: #fff; border: 1px solid #e7e3ef; border-radius: 12px; padding: 18px 20px; margin: 14px 0; }
  table.drugs { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 4px; }
  table.drugs th, table.drugs td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  table.drugs th { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #6b6577; }
  ol.refs { margin: 4px 0; padding-left: 20px; font-size: 13px; }
  ol.refs li { margin-bottom: 6px; }
  a { color: #6d28d9; }
  footer { margin-top: 40px; font-size: 12px; color: #6b6577; border-top: 1px solid #e7e3ef; padding-top: 12px; }
</style>
</head>
<body>
  <header>
    <h1>Target Identification Report</h1>
    <p class="lede"><strong>${escapeHtml(result.disease_label)}</strong> · ${escapeHtml(
      result.modality.replace(/_/g, " "),
    )} approach</p>
    <p class="muted">Generated by MentyTarget · ${escapeHtml(generatedOn)} · Model: ${escapeHtml(result.model)}</p>
  </header>

  <div class="stats">
    <div class="stat"><strong>${sections.length}</strong><span>Targets</span></div>
    <div class="stat"><strong>${totalDrugs}</strong><span>Known drugs</span></div>
    <div class="stat"><strong>${totalRefs}</strong><span>References</span></div>
  </div>

  <h2>Targets, Drugs &amp; Supporting Literature</h2>
  ${sectionsHtml}

  <footer>
    Drug data sourced from the Open Targets Platform. Literature sourced from Europe PMC.
    This report is for research purposes only.
  </footer>
</body>
</html>`
}

/** Triggers a browser download of the generated HTML report. */
export function downloadReportHtml(
  result: ScoreResponse,
  sections: TargetReportSection[],
): void {
  const html = generateReportHtml(result, sections)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `mentytarget_${result.disease_label.replace(/\s+/g, "_")}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
