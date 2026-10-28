const fs = require('fs');
const path = require('path');
const { createAuthorization } = require('./ga4-admin.cjs');

const BASELINE_END = '2026-10-27';
const legacyEvent = name => /^(retro_link_click|notes_link_click)$/i.test(name);
const family = name =>
  /^retro_link_click$/i.test(name)
    ? 'Profile/linktree'
    : /^notes_link_click$/i.test(name)
    ? 'Notes'
    : name;

function csv(report) {
  const columns = [...report.dimensions, ...report.metrics];
  const cell = (value, isText) => {
    let text = String(value ?? '');
    if (isText && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    [
      columns.map(name => cell(name, true)).join(','),
      ...report.rows.map(row =>
        columns
          .map(name => cell(row[name], report.dimensions.includes(name)))
          .join(','),
      ),
    ].join('\r\n') + '\r\n'
  );
}

function rowsFrom(data) {
  const dimensions = (data.dimensionHeaders || []).map(header => header.name);
  const metrics = (data.metricHeaders || []).map(header => header.name);
  return (data.rows || []).map(row =>
    Object.fromEntries([
      ...dimensions.map((name, index) => [
        name,
        row.dimensionValues[index].value,
      ]),
      ...metrics.map((name, index) => [name, row.metricValues[index].value]),
    ]),
  );
}

async function generate({
  env = process.env,
  request = fetch,
  log = value => console.log(value),
  now = new Date(),
  persist = true,
} = {}) {
  const propertyId = (env.GA4_PROPERTY_ID || '').replace(/^properties\//, '');
  if (!/^\d+$/.test(propertyId))
    throw new Error('Set a numeric GA4_PROPERTY_ID.');
  const endDate = env.GA4_REPORT_END_DATE || BASELINE_END;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    !Number.isFinite(Date.parse(endDate))
  )
    throw new Error('Invalid GA4_REPORT_END_DATE.');
  const authorization = createAuthorization(env, false);
  const api = async (base, resource, body) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await request(base + resource, {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: await authorization(),
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (response.ok) return data;
      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      throw new Error(
        `GA report HTTP ${response.status}: ${data.error?.message ||
          'Request failed'}`,
      );
    }
  };
  const admin = 'https://analyticsadmin.googleapis.com';
  const reporting = 'https://analyticsdata.googleapis.com';
  const property = await api(admin, `/v1beta/properties/${propertyId}`);
  const metadata = await api(
    reporting,
    `/v1beta/properties/${propertyId}/metadata`,
  );
  const available = new Set(
    (metadata.dimensions || []).map(item => item.apiName),
  );
  const startDate = property.createTime.slice(0, 10);
  if (endDate < startDate || endDate >= now.toISOString().slice(0, 10))
    throw new Error(
      'Use a complete report end date on or after property creation and before today.',
    );
  const recent = new Date(endDate + 'T00:00:00Z');
  recent.setUTCDate(recent.getUTCDate() - 27);
  const ranges = [
    {
      id: 'recent',
      label: 'Last 28 complete days',
      startDate:
        recent.toISOString().slice(0, 10) < startDate
          ? startDate
          : recent.toISOString().slice(0, 10),
      endDate,
    },
    { id: 'history', label: 'Since property creation', startDate, endDate },
  ];
  const scopes = [
    {
      id: 'site',
      label: 'reshra.xyz + subdomains',
      filter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: {
            matchType: 'FULL_REGEXP',
            value: '([a-z0-9-]+\\.)*reshra\\.xyz',
            caseSensitive: false,
          },
        },
      },
    },
    { id: 'all', label: 'All hosts (includes development)' },
  ];
  const periods = scopes.flatMap(scope =>
    ranges.map(range => ({
      ...range,
      id: `${range.id}-${scope.id}`,
      scopeLabel: scope.label,
      filter: scope.filter,
    })),
  );
  const snapshot = {
    propertyId,
    propertyName: property.displayName,
    timeZone: property.timeZone,
    generatedAt: now.toISOString(),
    cutoff: endDate,
    periods: [],
  };
  const runReport = async (period, definition) => {
    const dimensions = definition.dimensions || [];
    const missing = dimensions.filter(name => !available.has(name));
    if (missing.length)
      return {
        ...definition,
        dimensions,
        rows: [],
        unavailable: missing,
        rowCount: 0,
      };
    const rows = [];
    const responseMetadata = [];
    let total = 0;
    do {
      const data = await api(
        reporting,
        `/v1beta/properties/${propertyId}:runReport`,
        {
          dateRanges: [
            { startDate: period.startDate, endDate: period.endDate },
          ],
          dimensions: dimensions.map(name => ({ name })),
          metrics: definition.metrics.map(name => ({ name })),
          ...(period.filter || definition.filter
            ? {
                dimensionFilter:
                  period.filter && definition.filter
                    ? {
                        andGroup: {
                          expressions: [period.filter, definition.filter],
                        },
                      }
                    : period.filter || definition.filter,
              }
            : {}),
          limit: 1000,
          offset: rows.length,
          orderBys:
            definition.id === 'daily'
              ? [{ dimension: { dimensionName: 'date' } }]
              : [{ metric: { metricName: definition.metrics[0] }, desc: true }],
        },
      );
      const page = rowsFrom(data);
      if (!page.length && rows.length < (data.rowCount || 0))
        throw new Error(
          'Report pagination ended before all rows were returned.',
        );
      rows.push(...page);
      total = data.rowCount || 0;
      if (data.metadata) responseMetadata.push(data.metadata);
    } while (rows.length < total);
    return {
      ...definition,
      dimensions,
      rows,
      rowCount: total,
      responseMetadata,
    };
  };
  for (const period of periods) {
    const events = await runReport(period, {
      id: 'events',
      title: 'Event inventory (raw names)',
      dimensions: ['eventName'],
      metrics: ['eventCount', 'totalUsers'],
    });
    const names = events.rows.map(row => row.eventName).filter(legacyEvent);
    const legacyFilter = {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: names.length
            ? names
            : [
                'retro_link_click',
                'Retro_link_click',
                'notes_link_click',
                'Notes_link_click',
              ],
          caseSensitive: true,
        },
      },
    };
    const exact = eventName => ({
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: eventName,
          caseSensitive: true,
        },
      },
    });
    const definitions = [
      {
        id: 'overview',
        title: 'Traffic overview',
        dimensions: [],
        metrics: [
          'totalUsers',
          'sessions',
          'screenPageViews',
          'engagedSessions',
          'eventCount',
        ],
      },
      {
        id: 'links',
        title: 'Legacy profile and note interactions',
        dimensions: [
          'eventName',
          'hostName',
          'customEvent:destination',
          'customEvent:label',
          'customEvent:type',
          'customEvent:action',
        ],
        metrics: ['eventCount', 'totalUsers'],
        filter: legacyFilter,
      },
      {
        id: 'daily',
        title: 'Daily event trend',
        dimensions: ['date', 'eventName'],
        metrics: ['eventCount'],
      },
      {
        id: 'pages',
        title: 'Pages viewed',
        dimensions: ['hostName', 'pagePath', 'pageTitle'],
        metrics: ['eventCount', 'totalUsers'],
        filter: exact('page_view'),
      },
      {
        id: 'acquisition',
        title: 'Traffic sources and devices',
        dimensions: ['hostName', 'sessionSourceMedium', 'deviceCategory'],
        metrics: ['sessions', 'totalUsers', 'engagedSessions'],
      },
      {
        id: 'outbound',
        title: 'Automatic outbound clicks (separate signal)',
        dimensions: ['hostName', 'linkUrl', 'linkText'],
        metrics: ['eventCount', 'totalUsers'],
        filter: exact('click'),
      },
    ];
    const reports = [events];
    for (const definition of definitions)
      reports.push(await runReport(period, definition));
    const families = {};
    for (const row of events.rows.filter(row => legacyEvent(row.eventName))) {
      const name = family(row.eventName);
      families[name] = (families[name] || 0) + Number(row.eventCount);
    }
    snapshot.periods.push({ ...period, reports, families });
    log(
      `${period.label} / ${period.scopeLabel}: ${reports.length} reports, ${events.rows.length} raw event names.`,
    );
  }
  if (!persist) return { snapshot };
  const directory = path.resolve(__dirname, '../.local/analytics', endDate);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'snapshot.json'),
    JSON.stringify(snapshot, null, 2) + '\n',
  );
  for (const period of snapshot.periods)
    for (const report of period.reports)
      fs.writeFileSync(
        path.join(directory, `${period.id}-${report.id}.csv`),
        csv(report),
      );
  const template = fs.readFileSync(
    path.join(__dirname, 'ga4-report.html'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(directory, 'index.html'),
    template.replace(
      '__REPORT_DATA__',
      JSON.stringify(snapshot).replace(/</g, '\\u003c'),
    ),
  );
  log(`Saved private report files: ${directory}`);
  return { directory, snapshot };
}

if (require.main === module) {
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
  if (process.argv.includes('--help'))
    console.log(
      'Set GA4_PROPERTY_ID and local Google authentication, then run this read-only report generator. GA4_REPORT_END_DATE defaults to the frozen pre-deployment cutoff 2026-10-27. Dashboard/CSV/JSON files are saved under ignored .local/analytics/<end-date>.',
    );
  else
    generate().catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
module.exports = { generate, csv, rowsFrom, family };
