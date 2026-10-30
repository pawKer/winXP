const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { login } = require('./ga4-login.cjs');

function files() {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'winxp-ga-login-test-'),
  );
  const input = path.join(directory, 'client.json');
  const output = path.join(directory, 'authorized.json');
  fs.writeFileSync(
    input,
    JSON.stringify({
      installed: {
        client_id: 'test-client.apps.googleusercontent.com',
        client_secret: 'test-client-secret',
      },
    }),
  );
  return {
    input,
    output,
    cleanup() {
      for (const file of [input, output])
        if (fs.existsSync(file)) fs.unlinkSync(file);
      fs.rmdirSync(directory);
    },
  };
}

test('OAuth callback requires the matching state and PKCE, stores outside the repo and never logs secrets', async () => {
  const f = files();
  const logs = [];
  let resolveReady;
  let authorization;
  let exchanges = 0;
  const ready = new Promise(resolve => {
    resolveReady = resolve;
  });
  class Client extends OAuth2Client {
    async getToken(options) {
      exchanges++;
      assert.equal(options.code, 'test-authorization-code');
      assert.equal(
        crypto
          .createHash('sha256')
          .update(options.codeVerifier)
          .digest('base64url'),
        authorization.searchParams.get('code_challenge'),
      );
      assert.equal(
        options.redirect_uri,
        authorization.searchParams.get('redirect_uri'),
      );
      return {
        tokens: {
          refresh_token: 'test-private-refresh-token',
          scope: 'https://www.googleapis.com/auth/analytics.edit',
        },
      };
    }
  }
  const running = login({
    env: { GA4_OAUTH_CLIENT_FILE: f.input, GA4_CREDENTIAL_OUTPUT: f.output },
    Client,
    timeoutMs: 5000,
    log: text => {
      logs.push(text);
      const item = JSON.parse(text);
      if (item.authorizationUrl) {
        authorization = new URL(item.authorizationUrl);
        resolveReady();
      }
    },
  });
  running.catch(() => {});
  try {
    await Promise.race([ready, running]);
    const callback = new URL(authorization.searchParams.get('redirect_uri'));
    assert.equal(callback.hostname, '127.0.0.1');
    callback.searchParams.set('state', 'incorrect-state');
    callback.searchParams.set('code', 'test-authorization-code');
    const rejected = await fetch(callback);
    assert.equal(rejected.status, 400);
    assert.equal(exchanges, 0);
    assert.equal(fs.existsSync(f.output), false);
    callback.searchParams.set('state', authorization.searchParams.get('state'));
    const accepted = await fetch(callback);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.headers.get('cache-control'), 'no-store');
    assert((await accepted.text()).includes('connected'));
    const result = await running;
    assert.equal(result.credentialFile, f.output);
    assert.equal(exchanges, 1);
    const saved = JSON.parse(fs.readFileSync(f.output, 'utf8'));
    assert.equal(saved.type, 'authorized_user');
    assert.equal(saved.refresh_token, 'test-private-refresh-token');
    assert(!logs.join('').includes('test-client-secret'));
    assert(!logs.join('').includes('test-private-refresh-token'));
    assert(!logs.join('').includes('test-authorization-code'));
  } finally {
    await running.catch(() => {});
    f.cleanup();
  }
});

test('OAuth login refuses output inside the checkout and refuses to replace existing credentials', async () => {
  const f = files();
  try {
    await assert.rejects(
      login({
        env: {
          GA4_OAUTH_CLIENT_FILE: f.input,
          GA4_CREDENTIAL_OUTPUT: path.join(
            __dirname,
            '../../credentials-must-not-be-created.json',
          ),
        },
      }),
      /outside the repository/,
    );
    fs.writeFileSync(f.output, 'Keep existing credential');
    await assert.rejects(
      login({
        env: {
          GA4_OAUTH_CLIENT_FILE: f.input,
          GA4_CREDENTIAL_OUTPUT: f.output,
        },
      }),
      /already exists/,
    );
    assert.equal(fs.readFileSync(f.output, 'utf8'), 'Keep existing credential');
  } finally {
    f.cleanup();
  }
});
