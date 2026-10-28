const { GoogleAuth } = require('google-auth-library');
const { siteUrl } = require('../src/content/site');

const ADMIN_URL = 'https://analyticsadmin.googleapis.com';
const ANALYTICS_MODE = 'manual-v1';
const DIMENSIONS = [
  ['release', 'Release'],
  ['player', 'Player'],
  ['view_mode', 'View mode'],
  ['placement', 'Placement'],
];
const KEY_EVENTS = ['music_listen_click', 'music_play_start'];

function hasManualTracking(html) {
  const attribute = (tag, name) => {
    const match = tag.match(
      new RegExp(
        `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s/>]+))`,
        'i',
      ),
    );
    return match?.slice(1).find(value => value !== undefined);
  };
  return (html.match(/<meta\b[^>]*>/gi) || []).some(
    tag =>
      attribute(tag, 'name') === 'reshra:analytics-mode' &&
      attribute(tag, 'content') === ANALYTICS_MODE,
  );
}

function createAuthorization(env, apply, Auth = GoogleAuth) {
  if (env.GA4_ACCESS_TOKEN) {
    if (/\s/.test(env.GA4_ACCESS_TOKEN))
      throw new Error('GA4_ACCESS_TOKEN must contain only the access token.');
    return async () => `Bearer ${env.GA4_ACCESS_TOKEN}`;
  }
  if (!env.GOOGLE_APPLICATION_CREDENTIALS && env.GA4_USE_ADC !== '1')
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to the local credential-file path, GA4_USE_ADC=1 for explicitly configured Application Default Credentials, or GA4_ACCESS_TOKEN. Never put credential contents in source or command arguments.',
    );
  const auth = new Auth({
    keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
    scopes: [
      `https://www.googleapis.com/auth/analytics.${
        apply ? 'edit' : 'readonly'
      }`,
    ],
  });
  return async () => {
    try {
      const token = await auth.getAccessToken();
      if (!token) throw new Error('No token');
      return `Bearer ${token}`;
    } catch (_) {
      // SDK errors may carry request headers or credential material. Do not
      // serialize the error object or its request/response configuration.
      throw new Error(
        'Google authentication failed. Check the local credential file or ADC configuration and the service account access.',
      );
    }
  };
}

function summarize(configuration) {
  return {
    pageChangesEnabled: Boolean(configuration.settings.pageChangesEnabled),
    videoEngagementEnabled: Boolean(
      configuration.settings.videoEngagementEnabled,
    ),
    dimensions: configuration.dimensions
      .filter(
        item =>
          item.scope === 'EVENT' &&
          DIMENSIONS.some(([name]) => name === item.parameterName),
      )
      .map(item => item.parameterName),
    keyEvents: configuration.keyEvents
      .filter(item => KEY_EVENTS.includes(item.eventName))
      .map(item => item.eventName),
  };
}

async function configure({
  args = process.argv.slice(2),
  env = process.env,
  request = fetch,
  log = value => console.log(value),
  authorizationFactory = createAuthorization,
} = {}) {
  const allowed = new Set([
    '--help',
    '--discover',
    '--apply',
    '--after-deploy',
    '--mark-key-events',
  ]);
  if (args.some(arg => !allowed.has(arg)))
    throw new Error('Unknown option. Run node scripts/ga4-admin.cjs --help.');
  if (args.includes('--help')) {
    log(
      'Default: read-only plan. --discover lists accessible properties/web streams. --apply prepares reporting dimensions. --apply --after-deploy activates manual tracking after verifying the deployed site. Add --mark-key-events only after deployed event counts are verified.',
    );
    log(
      'Identity: GA4_PROPERTY_ID and GA4_MEASUREMENT_ID; GA4_STREAM_ID is optional when the measurement ID uniquely selects a stream. Authentication: GOOGLE_APPLICATION_CREDENTIALS (local path), GA4_USE_ADC=1, or GA4_ACCESS_TOKEN. Credentials stay outside source and command arguments.',
    );
    return { mode: 'help' };
  }
  const discover = args.includes('--discover');
  const apply = args.includes('--apply');
  const afterDeploy = args.includes('--after-deploy');
  const markKeyEvents = args.includes('--mark-key-events');
  if (discover && (apply || afterDeploy || markKeyEvents))
    throw new Error(
      '--discover is read-only and cannot be combined with apply/deployment options.',
    );
  if (markKeyEvents && !afterDeploy)
    throw new Error(
      'Mark key events only with --after-deploy, after the deployed event counts have been verified.',
    );
  const property = (env.GA4_PROPERTY_ID || '').replace(/^properties\//, '');
  const measurementId =
    env.GA4_MEASUREMENT_ID || env.REACT_APP_GA_MEASUREMENT_ID;
  const streamId = env.GA4_STREAM_ID;
  if (property && !/^\d+$/.test(property))
    throw new Error('Invalid GA4 property ID.');
  if (
    !discover &&
    (!property ||
      !/^G-[A-Z0-9]+$/.test(measurementId || '') ||
      (streamId && !/^\d+$/.test(streamId)))
  )
    throw new Error(
      'Set a numeric GA4_PROPERTY_ID and valid GA4_MEASUREMENT_ID. GA4_STREAM_ID is optional.',
    );
  const authorization = authorizationFactory(env, apply);
  async function api(url, method = 'GET', body) {
    const response = await request(ADMIN_URL + url, {
      method,
      headers: {
        Authorization: await authorization(),
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });
    let data;
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }
    if (!response.ok)
      throw new Error(
        `${method} ${url}: HTTP ${response.status} ${data.error?.message ||
          'Request failed'}`,
      );
    return data;
  }
  async function list(url, key) {
    const items = [];
    const seen = new Set();
    let next;
    do {
      const data = await api(
        url +
          '?pageSize=200' +
          (next ? `&pageToken=${encodeURIComponent(next)}` : ''),
      );
      if (data[key] && !Array.isArray(data[key]))
        throw new Error(`Unexpected ${key} response.`);
      items.push(...(data[key] || []));
      next = data.nextPageToken;
      if (next && seen.has(next))
        throw new Error('Repeated API pagination token.');
      if (next) seen.add(next);
    } while (next);
    return items;
  }
  if (discover) {
    const properties = property
      ? [{ property: `properties/${property}` }]
      : (await list('/v1beta/accountSummaries', 'accountSummaries')).flatMap(
          account => account.propertySummaries || [],
        );
    const result = [];
    for (const item of properties) {
      if (!/^properties\/\d+$/.test(item.property))
        throw new Error('Unexpected property resource.');
      const streams = await list(
        `/v1beta/${item.property}/dataStreams`,
        'dataStreams',
      );
      result.push({
        property: item.property,
        displayName: item.displayName,
        webStreams: streams
          .filter(stream => stream.webStreamData)
          .map(stream => ({
            name: stream.name,
            displayName: stream.displayName,
            measurementId: stream.webStreamData.measurementId,
            defaultUri: stream.webStreamData.defaultUri,
          })),
      });
    }
    log(JSON.stringify({ properties: result }, null, 2));
    return { mode: 'discover', properties: result };
  }
  const streamRoot = `properties/${property}/dataStreams`;
  const streams = streamId
    ? [await api(`/v1beta/${streamRoot}/${streamId}`)]
    : await list(`/v1beta/${streamRoot}`, 'dataStreams');
  const matches = streams.filter(
    stream => stream.webStreamData?.measurementId === measurementId,
  );
  if (matches.length !== 1)
    throw new Error(
      'The selected property/stream does not uniquely match the site measurement ID; no changes made.',
    );
  const stream = matches[0];
  if (!new RegExp(`^${streamRoot}/\\d+$`).test(stream.name))
    throw new Error('Unexpected stream resource; no changes made.');
  const settingsPath = `/v1alpha/${stream.name}/enhancedMeasurementSettings`;
  async function readConfiguration() {
    const [settings, dimensions, keyEvents] = await Promise.all([
      api(settingsPath),
      list(
        `/v1beta/properties/${property}/customDimensions`,
        'customDimensions',
      ),
      list(`/v1beta/properties/${property}/keyEvents`, 'keyEvents'),
    ]);
    return { settings, dimensions, keyEvents };
  }
  const current = await readConfiguration();
  const before = summarize(current);
  const newDimensions = DIMENSIONS.filter(
    ([name]) => !before.dimensions.includes(name),
  ).map(([parameterName, displayName]) => ({
    parameterName,
    displayName,
    scope: 'EVENT',
    description: 'Context from reshra.xyz media and navigation events.',
    disallowAdsPersonalization: true,
  }));
  const newKeyEvents = KEY_EVENTS.filter(
    name => !before.keyEvents.includes(name),
  ).map(eventName => ({ eventName, countingMethod: 'ONCE_PER_EVENT' }));
  const measurementChanges = {};
  if (before.pageChangesEnabled) measurementChanges.pageChangesEnabled = false;
  if (before.videoEngagementEnabled)
    measurementChanges.videoEngagementEnabled = false;
  const plan = {
    stage: markKeyEvents
      ? 'mark_verified_key_events'
      : afterDeploy
      ? 'after_manual_deployment'
      : 'prepare',
    stream: stream.name,
    measurementId,
    before,
    createDimensions: newDimensions,
    createKeyEvents: markKeyEvents ? newKeyEvents : [],
    deferredKeyEvents: markKeyEvents ? [] : newKeyEvents,
    reuseDimensions: before.dimensions,
    reuseKeyEvents: before.keyEvents,
    measurementChanges: afterDeploy ? measurementChanges : {},
    deferredUntilManualDeployment: afterDeploy ? {} : measurementChanges,
  };
  log(JSON.stringify(plan, null, 2));
  if (!apply) {
    log('Dry run only: no settings changed.');
    return { mode: 'plan', plan };
  }
  if (
    markKeyEvents &&
    (before.pageChangesEnabled || before.videoEngagementEnabled)
  )
    throw new Error(
      'Activate manual tracking after deployment and verify event counts before marking key events. No settings changed.',
    );
  if (afterDeploy) {
    // Public deployment checks must never receive Google authorization headers.
    const deployed = await request(`${siteUrl}/blog`, {
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
    });
    const html = await deployed.text();
    if (!deployed.ok || !hasManualTracking(html))
      throw new Error(
        'The live blog does not expose the matching manual-tracking version. Finish the manual deployment/cache update before activating these GA settings. No settings changed.',
      );
  }
  const applied = [];
  try {
    for (const dimension of newDimensions) {
      await api(
        `/v1beta/properties/${property}/customDimensions`,
        'POST',
        dimension,
      );
      applied.push(`Dimension: ${dimension.parameterName}`);
    }
    for (const event of plan.createKeyEvents) {
      await api(`/v1beta/properties/${property}/keyEvents`, 'POST', event);
      applied.push(`Key event: ${event.eventName}`);
    }
    if (afterDeploy && Object.keys(measurementChanges).length) {
      await api(
        `${settingsPath}?updateMask=${Object.keys(measurementChanges).join(
          ',',
        )}`,
        'PATCH',
        { name: current.settings.name, ...measurementChanges },
      );
      applied.push('Overlapping history/video measurement disabled');
    }
  } finally {
    log(JSON.stringify({ applied }, null, 2));
  }
  const observedAfter = summarize(await readConfiguration());
  if (
    !DIMENSIONS.every(([name]) => observedAfter.dimensions.includes(name)) ||
    (markKeyEvents &&
      !KEY_EVENTS.every(name => observedAfter.keyEvents.includes(name))) ||
    (afterDeploy &&
      (observedAfter.pageChangesEnabled ||
        observedAfter.videoEngagementEnabled))
  )
    throw new Error(
      'Configuration readback did not confirm all intended settings. Inspect the applied-action report before retrying.',
    );
  log(JSON.stringify({ observedAfter }, null, 2));
  log(
    afterDeploy
      ? markKeyEvents
        ? 'Key-event configuration readback passed. This does not replace verification of actual deployed event counts.'
        : 'Manual tracking activated and read back. Verify deployed event counts before marking key events.'
      : 'Definitions prepared and read back. Automatic measurement is unchanged; activate manual tracking only after the confirmed manual deployment.',
  );
  return { mode: 'applied', plan, applied, observedAfter };
}

if (require.main === module) {
  const main = async () => {
    if (!process.argv.includes('--help')) {
      const fs = require('fs');
      const path = require('path');
      const envFile = path.resolve(__dirname, '../.env');
      if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
    }
    await configure();
  };
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
module.exports = { configure, createAuthorization, hasManualTracking };
