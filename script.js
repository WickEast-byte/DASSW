/*
  Discord OAuth flow:
  1. Add discord-callback.html as an OAuth redirect URI in the Discord Developer Portal.
  2. After Discord returns a code, exchange it on a server for an access token.
  3. Use the token to verify the user and apply your whitelist.
  4. The client_secret must never be stored in frontend code.
*/
const DISCORD_CLIENT_ID = '1490758089610362911';
const REDIRECT_URI = window.location.origin + '/discord-callback.html';
const OAUTH_SCOPES = 'identify email';

function buildDiscordOAuthUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    prompt: 'consent'
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

function showLoginStep() {
  const loginStep = document.getElementById('login-step');
  const discordStart = document.getElementById('discord-start');
  if (loginStep && discordStart) {
    loginStep.classList.remove('hidden');
    discordStart.disabled = true;
    discordStart.textContent = 'Redirecting to Discord...';
  }
}

function handleDiscordCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const callbackRoot = document.querySelector('.callback-root');

  if (!callbackRoot) return;

  if (error) {
    callbackRoot.innerHTML = `
      <h1>Discord login failed</h1>
      <p class="login-message error">${error}</p>
      <p>Try again or check your app configuration.</p>
    `;
    return;
  }

  if (!code) {
    callbackRoot.innerHTML = `
      <h1>No authorization code found</h1>
      <p class="login-message error">Discord did not return a code.</p>
    `;
    return;
  }

  callbackRoot.innerHTML = `
    <h1>Discord Authorized</h1>
    <p class="login-message success">Authorization code received.</p>
    <p>Now exchange this code on your server for an access token and query Discord.</p>
    <pre class="auth-code">${code}</pre>
    <p>Example server-side action: POST to <code>/api/discord/verify</code> with this code.</p>
  `;
}

document.addEventListener('DOMContentLoaded', function () {
  const discordStart = document.getElementById('discord-start');
  if (discordStart) {
    discordStart.addEventListener('click', function () {
      showLoginStep();
      window.location.href = buildDiscordOAuthUrl();
    });
  }

  if (window.location.pathname.endsWith('discord-callback.html')) {
    handleDiscordCallback();
  }
});
