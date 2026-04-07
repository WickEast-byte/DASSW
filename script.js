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

async function exchangeCodeForToken(code) {
  try {
    const response = await fetch('/api/exchange-discord-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange token');
    }

    return await response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
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
      <a href="index.html" class="primary-button">Back to Login</a>
    `;
    return;
  }

  if (!code) {
    callbackRoot.innerHTML = `
      <h1>No authorization code found</h1>
      <p class="login-message error">Discord did not return a code.</p>
      <a href="index.html" class="primary-button">Back to Login</a>
    `;
    return;
  }

  // Show processing message
  callbackRoot.innerHTML = `
    <h1>Discord Authorized</h1>
    <p class="login-message success">Authorization code received. Exchanging for user data...</p>
    <div class="loading">Loading...</div>
  `;

  // Exchange code for token and user data
  exchangeCodeForToken(code)
    .then(userData => {
      callbackRoot.innerHTML = `
        <h1>Login Successful!</h1>
        <div class="user-info">
          <img src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png" 
               alt="${userData.username}" onerror="this.style.display='none'">
          <h2>Welcome, ${userData.username}!</h2>
          <p>User ID: ${userData.id}</p>
          <p>Email: ${userData.email || 'Not provided'}</p>
        </div>
        <button onclick="location.href='index.html'" class="primary-button">Continue</button>
      `;
    })
    .catch(error => {
      callbackRoot.innerHTML = `
        <h1>Error</h1>
        <p class="login-message error">Failed to get user data: ${error.message}</p>
        <a href="index.html" class="primary-button">Try Again</a>
      `;
    });
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

