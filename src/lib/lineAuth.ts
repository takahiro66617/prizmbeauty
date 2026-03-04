const LINE_CHANNEL_ID = "2009141875";

function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildLineOAuthUrl(botPrompt: "normal" | "aggressive" = "normal") {
  const state = generateState();
  localStorage.setItem("line_oauth_state", state);
  const redirectUri = `${window.location.origin}/auth/line/callback`;
  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid&bot_prompt=${botPrompt}`;
}
