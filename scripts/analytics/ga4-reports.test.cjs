const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generate, csv } = require('./ga4-reports.cjs');

test('historical reports paginate, retain raw event cases and filter every public-host query', async () => {
  const bodies = [];
  const dimensions = [
    'eventName',
    'date',
    'hostName',
    'customEvent:destination',
    'customEvent:label',
    'customEvent:type',
    'customEvent:action',
    'pagePath',
    'pageTitle',
    'sessionSourceMedium',
    'deviceCategory',
    'linkUrl',
    'linkText',
  ];
  const request = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (url.endsWith('/metadata'))
      return {
        ok: true,
        json: async () => ({
          dimensions: dimensions.map(apiName => ({ apiName })),
        }),
      };
    if (!url.includes(':runReport')) {
      assert.equal(options.method, 'GET');
      return {
        ok: true,
        json: async () => ({
          displayName: 'Test property',
          createTime: '2025-08-25T00:00:00Z',
          timeZone: 'Etc/GMT',
        }),
      };
    }
    const body = JSON.parse(options.body);
    bodies.push(body);
    const names = body.dimensions.map(item => item.name),
      metrics = body.metrics.map(item => item.name);
    const events = names.length === 1 && names[0] === 'eventName';
    const raw = events
      ? Array.from({ length: body.offset ? 1 : 1000 }, (_, i) => ({
          dimensionValues: [
            {
              value: body.offset
                ? 'retro_link_click'
                : i === 0
                ? 'Retro_link_click'
                : 'other_event_' + i,
            },
          ],
          metricValues: metrics.map(() => ({ value: '1' })),
        }))
      : [];
    return {
      ok: true,
      json: async () => ({
        dimensionHeaders: names.map(name => ({ name })),
        metricHeaders: metrics.map(name => ({ name })),
        rowCount: events ? 1001 : 0,
        rows: raw,
        metadata: { timeZone: 'Etc/GMT' },
      }),
    };
  };
  const { snapshot } = await generate({
    env: { GA4_PROPERTY_ID: '123', GA4_ACCESS_TOKEN: 'test-token' },
    request,
    persist: false,
    log: () => {},
    now: new Date('2026-10-28T12:00:00Z'),
  });
  assert.equal(snapshot.periods.length, 4);
  for (const period of snapshot.periods) {
    const events = period.reports.find(report => report.id === 'events');
    assert.equal(events.rows.length, 1001);
    assert.equal(events.rows[0].eventName, 'Retro_link_click');
    assert.equal(events.rows[1000].eventName, 'retro_link_click');
    assert.equal(period.families['Profile/linktree'], 2);
  }
  assert(
    bodies
      .slice(0, 16)
      .every(body => JSON.stringify(body.dimensionFilter).includes('hostName')),
  );
  assert(
    bodies
      .slice(16)
      .every(
        body =>
          !JSON.stringify(body.dimensionFilter || {}).includes('hostName'),
      ),
  );
});

test('CSV preserves missing parameters and quotes values while neutralizing spreadsheet formulas', () => {
  const text = csv({
    dimensions: ['label', 'destination'],
    metrics: ['eventCount'],
    rows: [
      { label: '=1+1', destination: '(not set)', eventCount: '2' },
      { label: 'A "quoted" label', destination: '', eventCount: '3' },
    ],
  });
  assert(text.includes('"\'=1+1","(not set)","2"'));
  assert(text.includes('"A ""quoted"" label","","3"'));
});
