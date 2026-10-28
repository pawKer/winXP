import { shouldSendAnalytics } from './useGA';

test('analytics sends for the canonical site and its real subdomains', () => {
  ['reshra.xyz', 'www.reshra.xyz', 'qr.reshra.xyz'].forEach(host => {
    expect(shouldSendAnalytics(host)).toBe(true);
  });
});

test('local previews and lookalike hosts do not pollute production analytics', () => {
  [
    'localhost',
    '127.0.0.1',
    '::1',
    'preview.example.com',
    'reshra.xyz.example.com',
    'fakeshra.xyz',
  ].forEach(host => {
    expect(shouldSendAnalytics(host)).toBe(false);
  });
});

test('a deliberate debug override can enable a local verification build', () => {
  expect(shouldSendAnalytics('localhost', true)).toBe(true);
});
