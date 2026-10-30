const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

async function login({
  env = process.env,
  Client = OAuth2Client,
  log = value => console.log(value),
  timeoutMs = 15 * 60 * 1000,
} = {}) {
  const input = env.GA4_OAUTH_CLIENT_FILE;
  if (!input)
    throw new Error(
      'Set GA4_OAUTH_CLIENT_FILE to the downloaded Desktop OAuth client JSON path.',
    );
  const { installed } = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!installed?.client_id || !installed.client_secret)
    throw new Error(
      'A Desktop OAuth client JSON file is required. Service-account credentials can be used directly by ga4-admin.cjs.',
    );
  const output = path.resolve(
    env.GA4_CREDENTIAL_OUTPUT ||
      path.join(os.homedir(), '.config/reshra/ga4-authorized-user.json'),
  );
  const workspace = fs
    .realpathSync(path.resolve(__dirname, '../..'))
    .toLowerCase();
  const insideWorkspace = directory => {
    const resolved = path.resolve(directory).toLowerCase();
    return resolved === workspace || resolved.startsWith(workspace + path.sep);
  };
  if (insideWorkspace(output))
    throw new Error('Store authorized credentials outside the repository.');
  if (fs.existsSync(output))
    throw new Error(
      'The output credential file already exists; use a new GA4_CREDENTIAL_OUTPUT path to avoid overwriting it.',
    );
  const state = crypto.randomBytes(32).toString('base64url');
  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
  ];
  let client;
  let verifier;
  let redirectUri;
  let timer;
  let processing = false;
  let finish;
  let fail;
  const completed = new Promise((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  const server = http.createServer(async (request, response) => {
    const send = (status, text) => {
      response.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(text);
    };
    let url;
    try {
      url = new URL(request.url, redirectUri);
    } catch (_) {
      send(400, 'Invalid callback URL.');
      return;
    }
    if (request.method !== 'GET' || url.pathname !== '/oauth2callback') {
      send(404, 'Not found.');
      return;
    }
    const incomingState = Buffer.from(url.searchParams.get('state') || '');
    const expectedState = Buffer.from(state);
    if (
      incomingState.length !== expectedState.length ||
      !crypto.timingSafeEqual(incomingState, expectedState)
    ) {
      send(
        400,
        'Invalid login state. Return to the original Google sign-in link.',
      );
      return;
    }
    if (processing) {
      send(409, 'Login is already being completed.');
      return;
    }
    processing = true;
    if (url.searchParams.has('error')) {
      send(400, 'Google authorization was not completed. Return to Codex.');
      fail(new Error('Google authorization was declined or blocked.'));
      return;
    }
    const code = url.searchParams.get('code');
    if (!code) {
      send(400, 'No authorization code returned.');
      fail(new Error('No authorization code returned.'));
      return;
    }
    try {
      const { tokens } = await client.getToken({
        code,
        codeVerifier: verifier,
        redirect_uri: redirectUri,
      });
      if (!tokens.refresh_token)
        throw new Error('No offline credential returned.');
      const directory = path.dirname(output);
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      if (insideWorkspace(fs.realpathSync(directory)))
        throw new Error('Credential directory resolves inside the repository.');
      fs.writeFileSync(
        output,
        JSON.stringify(
          {
            type: 'authorized_user',
            client_id: installed.client_id,
            client_secret: installed.client_secret,
            refresh_token: tokens.refresh_token,
          },
          null,
          2,
        ) + '\n',
        { flag: 'wx', mode: 0o600 },
      );
      send(
        200,
        'Google Analytics access is connected. You can close this tab and return to Codex.',
      );
      finish({ credentialFile: output, grantedScopes: tokens.scope || '' });
    } catch (_) {
      send(
        500,
        'Login could not be completed. Return to Codex; no credential contents are shown here.',
      );
      fail(
        new Error(
          'Google login/token storage failed. No tokens or client secrets have been logged.',
        ),
      );
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    redirectUri = `http://127.0.0.1:${server.address().port}/oauth2callback`;
    client = new Client({
      clientId: installed.client_id,
      clientSecret: installed.client_secret,
      redirectUri,
    });
    const pkce = await client.generateCodeVerifierAsync();
    verifier = pkce.codeVerifier;
    const authorizationUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
      code_challenge_method: 'S256',
      code_challenge: pkce.codeChallenge,
    });
    log(
      JSON.stringify(
        { authorizationUrl, credentialOutput: output, scopes },
        null,
        2,
      ),
    );
    timer = setTimeout(
      () =>
        fail(
          new Error(
            'Google login timed out after 15 minutes. Start a new login flow.',
          ),
        ),
      timeoutMs,
    );
    const result = await completed;
    log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    clearTimeout(timer);
    const closeTimeout = setTimeout(() => server.closeAllConnections(), 1000);
    closeTimeout.unref();
    await new Promise(resolve => server.close(resolve));
    clearTimeout(closeTimeout);
  }
}

if (require.main === module) {
  if (process.argv.includes('--help')) {
    console.log(
      'Set GA4_OAUTH_CLIENT_FILE to the Desktop client JSON path and run this tool. Complete Google consent in the printed link. It stores authorized-user credentials outside the repository; GA4_CREDENTIAL_OUTPUT can choose a new output path. No GA settings are changed.',
    );
  } else {
    login().catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
module.exports = { login };
