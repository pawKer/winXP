const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  configure,
  createAuthorization,
  hasManualTracking,
} = require('./ga4-admin.cjs');

const env = {
  GA4_PROPERTY_ID: '123',
  GA4_STREAM_ID: '456',
  GA4_MEASUREMENT_ID: 'G-TEST123',
  GA4_ACCESS_TOKEN: 'test-token-not-a-real-credential',
};
const dimensions = ['release', 'player', 'view_mode', 'placement'];
const events = ['music_listen_click', 'music_play_start'];
const settingsName =
  'properties/123/dataStreams/456/enhancedMeasurementSettings';

function fixture({
  existing = false,
  deployed = true,
  persist = true,
  failParameter,
  duplicateStream = false,
} = {}) {
  const calls = [];
  const logs = [];
  const state = {
    settings: {
      name: settingsName,
      streamEnabled: true,
      scrollsEnabled: true,
      pageChangesEnabled: true,
      videoEngagementEnabled: true,
    },
    dimensions: existing
      ? dimensions.map(parameterName => ({ parameterName, scope: 'EVENT' }))
      : [],
    keyEvents: existing ? events.map(eventName => ({ eventName })) : [],
  };
  const response = (data, status = 200) => ({
    ok: status === 200,
    status,
    json: async () => JSON.parse(JSON.stringify(data)),
  });
  const stream = {
    name: 'properties/123/dataStreams/456',
    webStreamData: {
      measurementId: env.GA4_MEASUREMENT_ID,
      defaultUri: 'https://reshra.xyz',
    },
  };
  const request = async (url, options = {}) => {
    const method = options.method || 'GET';
    calls.push({ url, method, options });
    if (url === 'https://reshra.xyz/blog') {
      assert.equal(
        options.headers,
        undefined,
        'Public preflight never receives a Google token',
      );
      return {
        ok: true,
        text: async () =>
          deployed
            ? '<meta name="reshra:analytics-mode" content="manual-v1">'
            : '<title>Old desktop</title>',
      };
    }
    assert(url.startsWith('https://analyticsadmin.googleapis.com/'));
    assert.equal(
      options.headers.Authorization,
      `Bearer ${env.GA4_ACCESS_TOKEN}`,
    );
    const route = new URL(url).pathname;
    if (route === '/v1beta/accountSummaries')
      return response({
        accountSummaries: [
          {
            propertySummaries: [
              { property: 'properties/123', displayName: 'reshra' },
            ],
          },
        ],
      });
    if (route === '/v1beta/properties/123/dataStreams/456')
      return response(stream);
    if (route === '/v1beta/properties/123/dataStreams')
      return response({
        dataStreams: duplicateStream
          ? [stream, { ...stream, name: 'properties/123/dataStreams/789' }]
          : [
              stream,
              {
                name: 'properties/123/dataStreams/999',
                type: 'ANDROID_APP_DATA_STREAM',
              },
            ],
      });
    if (route.endsWith('/enhancedMeasurementSettings')) {
      if (method === 'PATCH')
        Object.assign(state.settings, JSON.parse(options.body));
      return response(state.settings);
    }
    for (const [resource, key] of [
      ['customDimensions', 'dimensions'],
      ['keyEvents', 'keyEvents'],
    ]) {
      if (!route.endsWith('/' + resource)) continue;
      if (method === 'POST') {
        const body = JSON.parse(options.body);
        if (failParameter && body.parameterName === failParameter)
          return response(
            { error: { message: 'Simulated quota failure' } },
            429,
          );
        if (persist) state[key].push(body);
        return response({ name: route.slice('/v1beta/'.length) + '/created' });
      }
      return response({ [resource]: state[key] });
    }
    throw new Error('Unexpected API request: ' + route);
  };
  const run = (args = [], overrides = {}) =>
    configure({
      args,
      env,
      request,
      log: value => logs.push(value),
      ...overrides,
    });
  const writes = () => calls.filter(call => call.method !== 'GET');
  return { calls, logs, state, request, run, writes };
}

test('help and invalid option combinations never authenticate or access the network', async () => {
  const forbidden = () => {
    throw new Error('Authentication/network must not run');
  };
  assert.equal(
    (
      await configure({
        args: ['--help'],
        env: {},
        authorizationFactory: forbidden,
        request: forbidden,
        log: () => {},
      })
    ).mode,
    'help',
  );
  await assert.rejects(
    configure({
      args: ['--discover', '--apply'],
      env: {},
      authorizationFactory: forbidden,
    }),
    /read-only/,
  );
});

test('deployment marker tolerates edge HTML formatting without accepting another tracking version', () => {
  assert(
    hasManualTracking(
      '<meta name="reshra:analytics-mode" content="manual-v1">',
    ),
  );
  assert(
    hasManualTracking(
      "<META content='manual-v1' name='reshra:analytics-mode' />",
    ),
  );
  assert(
    hasManualTracking('<meta content=manual-v1 name=reshra:analytics-mode>'),
  );
  assert(
    !hasManualTracking(
      '<meta name="reshra:analytics-mode" content="automatic-v1">',
    ),
  );
});

test('default plan reads the property but makes no writes or deployment requests', async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.mode, 'plan');
  assert.equal(result.plan.createDimensions.length, 4);
  assert.equal(result.plan.createKeyEvents.length, 0);
  assert.equal(result.plan.deferredKeyEvents.length, 2);
  assert.deepEqual(result.plan.measurementChanges, {});
  assert.deepEqual(result.plan.deferredUntilManualDeployment, {
    pageChangesEnabled: false,
    videoEngagementEnabled: false,
  });
  assert.deepEqual(f.writes(), []);
  assert(!f.calls.some(call => call.url === 'https://reshra.xyz/blog'));
});

test('preparation creates and reads back definitions while leaving automatic tracking unchanged', async () => {
  const f = fixture();
  const result = await f.run(['--apply']);
  assert.equal(result.mode, 'applied');
  assert.equal(f.writes().length, 4);
  assert.equal(
    f.state.keyEvents.length,
    0,
    'Unverified new events are not marked before deployment',
  );
  assert(f.writes().every(call => call.method === 'POST'));
  assert.equal(f.state.settings.pageChangesEnabled, true);
  assert.equal(f.state.settings.videoEngagementEnabled, true);
  assert(!f.calls.some(call => call.url === 'https://reshra.xyz/blog'));
  const count = f.writes().length;
  const repeated = await f.run(['--apply']);
  assert.equal(f.writes().length, count, 'Existing definitions are reused');
  assert.deepEqual(repeated.applied, []);
});

test('a wrong or ambiguous measurement ID prevents all writes', async () => {
  const f = fixture();
  await assert.rejects(
    f.run(['--apply'], { env: { ...env, GA4_MEASUREMENT_ID: 'G-OTHER123' } }),
    /does not uniquely match/,
  );
  assert.deepEqual(f.writes(), []);
  const duplicate = fixture({ duplicateStream: true });
  await assert.rejects(
    duplicate.run(['--apply'], { env: { ...env, GA4_STREAM_ID: '' } }),
    /does not uniquely match/,
  );
  assert.deepEqual(duplicate.writes(), []);
});

test('matching measurement ID can select the web stream without a supplied stream ID', async () => {
  const f = fixture();
  const result = await f.run([], { env: { ...env, GA4_STREAM_ID: '' } });
  assert.equal(result.plan.stream, 'properties/123/dataStreams/456');
});

test('discovery lists authorized properties and web streams without writes', async () => {
  const f = fixture();
  const result = await f.run(['--discover'], {
    env: { GA4_ACCESS_TOKEN: env.GA4_ACCESS_TOKEN },
  });
  assert.equal(result.properties[0].property, 'properties/123');
  assert.equal(result.properties[0].webStreams.length, 1);
  assert.equal(
    result.properties[0].webStreams[0].measurementId,
    env.GA4_MEASUREMENT_ID,
  );
  assert.deepEqual(f.writes(), []);
});

test('activation refuses to write while the live site still serves the old tracking version', async () => {
  const f = fixture({ deployed: false });
  await assert.rejects(
    f.run(['--apply', '--after-deploy']),
    /Finish the manual deployment/,
  );
  assert.deepEqual(f.writes(), []);
});

test('after deployment only the overlapping automatic settings change and readback confirms them', async () => {
  const f = fixture({ existing: true });
  const result = await f.run(['--apply', '--after-deploy']);
  assert.equal(f.writes().length, 1);
  assert.equal(f.writes()[0].method, 'PATCH');
  assert.deepEqual(JSON.parse(f.writes()[0].options.body), {
    name: settingsName,
    pageChangesEnabled: false,
    videoEngagementEnabled: false,
  });
  assert.equal(f.state.settings.scrollsEnabled, true);
  assert.equal(f.state.settings.streamEnabled, true);
  assert.equal(result.observedAfter.pageChangesEnabled, false);
  assert.equal(result.observedAfter.videoEngagementEnabled, false);
});

test('accepted writes that do not persist fail the readback check', async () => {
  const f = fixture({ persist: false });
  await assert.rejects(f.run(['--apply']), /readback did not confirm/);
});

test('key-event marking is deferred until a separate verified-events phase after activation', async () => {
  const f = fixture({ existing: true });
  f.state.keyEvents = [];
  await assert.rejects(
    f.run(['--apply', '--after-deploy', '--mark-key-events']),
    /verify event counts/,
  );
  assert.deepEqual(f.writes(), []);
  await f.run(['--apply', '--after-deploy']);
  assert.equal(f.state.keyEvents.length, 0);
  const result = await f.run([
    '--apply',
    '--after-deploy',
    '--mark-key-events',
  ]);
  assert.equal(result.plan.stage, 'mark_verified_key_events');
  assert.deepEqual(
    f.state.keyEvents.map(item => item.eventName),
    events,
  );
});

test('partial failure stops further writes and reports the successfully applied prefix', async () => {
  const f = fixture({ failParameter: 'player' });
  await assert.rejects(f.run(['--apply']), /429/);
  assert.equal(f.writes().length, 2);
  assert.deepEqual(
    f.state.dimensions.map(item => item.parameterName),
    ['release'],
  );
  assert.deepEqual(JSON.parse(f.logs[f.logs.length - 1]).applied, [
    'Dimension: release',
  ]);
});

test('credential files and opted-in ADC use scoped official SDK authentication without exposing SDK errors', async () => {
  const options = [];
  class Auth {
    constructor(value) {
      options.push(value);
    }
    async getAccessToken() {
      return 'sdk-test-token';
    }
  }
  const read = createAuthorization(
    { GOOGLE_APPLICATION_CREDENTIALS: 'C:/local/credentials.json' },
    false,
    Auth,
  );
  assert.equal(await read(), 'Bearer sdk-test-token');
  assert.equal(options[0].keyFilename, 'C:/local/credentials.json');
  assert.deepEqual(options[0].scopes, [
    'https://www.googleapis.com/auth/analytics.readonly',
  ]);
  await createAuthorization({ GA4_USE_ADC: '1' }, true, Auth)();
  assert.deepEqual(options[1].scopes, [
    'https://www.googleapis.com/auth/analytics.edit',
  ]);
  assert.throws(
    () => createAuthorization({}, false, Auth),
    /GOOGLE_APPLICATION_CREDENTIALS/,
  );
  class BrokenAuth {
    async getAccessToken() {
      throw new Error('credential-secret');
    }
  }
  await assert.rejects(
    createAuthorization({ GA4_USE_ADC: '1' }, false, BrokenAuth)(),
    error =>
      error.message.includes('Google authentication failed') &&
      !error.message.includes('credential-secret'),
  );
});
