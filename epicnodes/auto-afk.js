/*
This file is for automaticially AFKing on the epicnodes.com/afk page.
This has no ads, so your CPU won't get bombarded. No browsers required either!

HOW TO SETUP:
1. Replace YOUR_COOKIE with your cookie, which you can find on the epicnodes.com/afk page in inspect in Network (you might have to refresh or click record if it doesnt work)
2. Replace YOUR_BOT_TOKEN with your discord bot token from the discord developer portal.
3. Replace YOUR_CHANNEL_ID with your channel ID for the embed to be sent reporting live statistics of whats happening on the AFK page.

NOTES:
- The websocket may disconnect after 5 minutes, due to inactivity. It automaticially reconnects the websocket each 5 seconds if it disconnects.
- If the websocket connection suddenly closes and/or doesnt connect after 5+ attempts, it's probably the website going down.
- Your coins will be updated each time the websocket reconnects. Stopping the server transfers the coins to your account.
- Any error code like 403 or 401 means an invalid cookie or discord bot token.
*/

// Discord.js v14 or higher
const { Client, GatewayIntentBits } = require("discord.js");

// Discord.js v13 or lower
// const { Client, Intents } = require("discord.js");
const WebSocket = require("ws");
const axios = require("axios");

const wsUrl = "wss://epicnodes.com/ws"; // This is the websocket for the AFK page. I will change this if anything goes wrong, like an invalid websocket.
const cookieHeader = "YOUR_COOKIE"; // Replace YOUR_COOKIE with your cookie.

// This part is used to send the embed to the channel to give you live stats. At first, some stuff may say N/A, but after the embed updates, it will be back to normal.
const token = "YOUR_BOT_TOKEN"; // Replace YOUR_BOT_TOKEN with the Discord Bot token of the bot.
const channelId = "YOUR_CHANNEL_ID"; // Replace YOUR_CHANNEL_ID with the channel id you would like to send the embed to.

// Changing anything below this line will result in the code not working.
let ws;
let pingInterval;
let lastMessage = null;

// This is for discord.js v14+
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
});

// Uncomment this and comment the discord.js v14+ if you are under discord.js v14.
/*
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES
    ]
});
*/

// This might not work for discord.js v13 or lower, but its recommended to use discord.js v14+.
async function sendToDiscord(message, type) {
  try {
    const embedFields = [
      { name: "Active Users", value: String(message.activeUsers || "N/A"), inline: true },
      { name: "Coins", value: String(message.coins || "N/A"), inline: true },
    ];
    
    if (type === "initState") {
      embedFields.push(
        { name: "Total Coins Earned", value: String(message.stats.totalCoinsEarned || "N/A"), inline: true },
        { name: "Level", value: String(message.stats.level || "N/A"), inline: true },
        { name: "XP", value: String(message.stats.xp || "N/A"), inline: true },
        { name: "Streak", value: String(message.stats.streak || "N/A"), inline: true },
        { name: "Last Online", value: String(message.stats.lastOnline || "N/A"), inline: true },
        { name: "Rains Collected", value: String(message.stats.eventStats.rainsCollected || "N/A"), inline: true },
        { name: "Chests Opened", value: String(message.stats.eventStats.chestsOpened || "N/A"), inline: true },
        { name: "Next Coin Rain", value: String(message.nextEvents.coinRain || "N/A"), inline: true },
        { name: "Next Chest Event", value: String(message.nextEvents.chest || "N/A"), inline: true }
      );
    } else if (type === "update") {
      embedFields.push(
        { name: "Level Up", value: message.levelUp ? "Yes" : "No", inline: true },
        { name: "Party Multiplier", value: String(message.multipliers.party || "N/A"), inline: true },
        { name: "Streak Multiplier", value: String(message.multipliers.streak || "N/A"), inline: true },
        { name: "Level Multiplier", value: String(message.multipliers.level || "N/A"), inline: true },
        { name: "Total AFK Time", value: String(message.stats.totalAfkTime || "N/A"), inline: true },
        { name: "Total Coins Earned", value: String(message.stats.totalCoinsEarned || "N/A"), inline: true },
        { name: "Level", value: String(message.stats.level || "N/A"), inline: true },
        { name: "XP", value: String(message.stats.xp || "N/A"), inline: true },
        { name: "Streak", value: String(message.stats.streak || "N/A"), inline: true }
      );
    }

    const channel = await client.channels.fetch(channelId);
    if (channel) {
      if (lastMessage) {
        await lastMessage.edit({
          embeds: [
            {
              title: `WebSocket ${type} Message`,
              fields: embedFields,
            },
          ],
        });
        console.log(`Message of type '${type}' updated in Discord channel.`);
      } else {
        lastMessage = await channel.send({
          embeds: [
            {
              title: `WebSocket ${type} Message`,
              fields: embedFields,
            },
          ],
        });
        console.log(`Message of type '${type}' sent to Discord channel.`);
      }
    }
  } catch (error) {
    console.error("Failed to send message to Discord:", error.message);
  }
}

function sendPing() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("Sending ping...");
    ws.send(JSON.stringify({ type: "ping" }));
  }
}

function connect() {
  ws = new WebSocket(wsUrl, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  ws.on("open", () => {
    console.log("WebSocket connection established with Cookie header.");
    clearInterval(pingInterval);
    pingInterval = setInterval(sendPing, 5000);
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Message received:", message);

      if (message.type === "initState") {
        sendToDiscord(message, "initState");
      } else if (message.type === "update") {
        sendToDiscord(message, "update");
      } else {
        console.log("Unhandled message type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error.message);
    }
  });

  ws.on("close", (code, reason) => {
    console.warn(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
    console.log("Reconnecting in 5 seconds...");
    clearInterval(pingInterval);
    setTimeout(connect, 5000);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
}

client.once("ready", () => {
  console.log("Bot is logged in and ready.");
  connect();
});

client.login(token);
