const fs = require('node:fs');
const path = require('node:path');

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const [owner, repoName] = repo.split('/');

async function ghApi(apiPath, method = 'GET', body) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}${apiPath}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${apiPath} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function ensureLabel() {
  try {
    await ghApi(`/labels/lighthouse`);
  } catch (e) {
    if (e.message.includes('404')) {
      await ghApi('/labels', 'POST', {
        name: 'lighthouse',
        color: 'f9d0c4',
        description: 'Lighthouse CI audit reports',
      });
    } else {
      throw e;
    }
  }
}

function findRepresentativeRun(manifest) {
  const rep = manifest.find((m) => m.isRepresentativeRun);
  if (rep) return rep;
  return manifest[0];
}

function formatScore(score) {
  if (score === undefined || score === null) return 'N/A';
  return (score * 100).toFixed(0);
}

function getAuditItems(report, auditIds) {
  const items = [];
  for (const id of auditIds) {
    const audit = report.audits[id];
    if (!audit) continue;
    if (audit.score === null || audit.score === 1) continue;
    items.push({
      id,
      title: audit.title,
      description: audit.description,
      score: audit.score,
      displayValue: audit.displayValue,
    });
  }
  return items;
}

async function main() {
  const cwd = process.cwd();
  console.log('CWD:', cwd);
  try {
    const entries = fs.readdirSync(cwd);
    console.log('Root entries:', entries);
  } catch (e) {
    console.log('Failed to list root:', e);
  }

  const manifestPath = path.join(cwd, '.lighthouseci', 'manifest.json');
  console.log('Looking for manifest at:', manifestPath);

  if (!fs.existsSync(manifestPath)) {
    console.log('No manifest.json found, skipping issue creation.');
    try {
      const lhDir = path.join(cwd, '.lighthouseci');
      if (fs.existsSync(lhDir)) {
        const files = fs.readdirSync(lhDir);
        console.log('.lighthouseci files:', files);
      } else {
        console.log('.lighthouseci directory does not exist');
      }
    } catch (e) {
      console.log('Failed to inspect .lighthouseci:', e);
    }
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const run = findRepresentativeRun(manifest);
  if (!run) {
    console.log('No runs found in manifest.');
    return;
  }

  const reportPath = run.jsonPath;
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  const categories = report.categories;
  const performance = categories.performance?.score ?? null;
  const accessibility = categories.accessibility?.score ?? null;
  const bestPractices = categories['best-practices']?.score ?? null;
  const seo = categories.seo?.score ?? null;

  const performanceAudits = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
  ];

  const failingAudits = getAuditItems(report, performanceAudits);

  if (failingAudits.length === 0) {
    const allAuditIds = Object.keys(report.audits).filter((id) => {
      const a = report.audits[id];
      return (
        a.scoreDisplayMode !== 'notApplicable' &&
        a.score !== null &&
        a.score !== 1
      );
    });
    const extras = getAuditItems(report, allAuditIds).slice(0, 10);
    for (const extra of extras) {
      if (!failingAudits.find((a) => a.id === extra.id)) {
        failingAudits.push(extra);
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const runUrl = `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  let body = `## Lighthouse Audit Results — ${today}\n\n`;
  body += `Workflow run: ${runUrl}\n\n`;
  body += `| Category | Score |\n| --- | --- |\n`;
  body += `| Performance | ${formatScore(performance)} |\n`;
  body += `| Accessibility | ${formatScore(accessibility)} |\n`;
  body += `| Best Practices | ${formatScore(bestPractices)} |\n`;
  body += `| SEO | ${formatScore(seo)} |\n\n`;

  if (failingAudits.length > 0) {
    body += `### Failing / Warning Audits\n\n`;
    for (const a of failingAudits) {
      body += `- **${a.title}** (${a.id})`;
      if (a.displayValue) body += ` — ${a.displayValue}`;
      body += `\n`;
      if (a.description) {
        body += `  - ${a.description.replace(/\n/g, ' ')}\n`;
      }
    }
  } else {
    body += `### All audits passed\n`;
  }

  body += `\n### Full Report\n`;
  body += `Download HTML/JSON reports from the workflow artifacts (see \`lighthouse-reports\`).\n`;

  await ensureLabel();

  await ghApi('/issues', 'POST', {
    title: `Lighthouse Audit — ${today}`,
    body,
    labels: ['lighthouse'],
  });

  console.log('Issue created successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
