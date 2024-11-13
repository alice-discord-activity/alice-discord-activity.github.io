import "../styles/style.scss";
import rocket from "../images/rocket.png";

import { DiscordSDK } from "@discord/embedded-app-sdk";
// Define varibles (For the life of me i cant get .env varibles working)

let auth;

let serverurl = new URL(`http://${import.meta.env.VITE_DISCORD_CLIENT_ID}.discordsays.com/.proxy/server/alicediscord`);

if (!import.meta.env.DEV){
var discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
}

console.log(await import.meta.env.VITE_DISCORD_CLIENT_ID)

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

// Authorize with Discord Client
const { code } = await discordSdk.commands.authorize({
  client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });
  
  // Retrieve an access_token from your activity's server
  // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
  // Read more about constructing a full URL and using external resources at
  // https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
  const response = await fetch(`${serverurl}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

  async function appendVoiceChannelName() {
const app = document.querySelector('#app');
  
  let activityChannelName = 'Unknown';
  
  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }
  
  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}


document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocket}" class="rocket" alt="Discord-Rocket">
    <h1>Hello, World!</h1>
    <p>This is all temporary!!</p>
    <div class="box"><b></b></div>
  </div>
`;

setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");

  // We can now make API calls within the scopes we requested in setupDiscordSDK()
  // Note: the access_token returned is a sensitive secret and should be treated as such
  appendVoiceChannelName();
});