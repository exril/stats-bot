const { Client, GatewayIntentBits, Partials, Events, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const systemInformation = require('systeminformation');
const pm2 = require('pm2');
const { exec } = require('child_process');

let fetch;

(async () => {
  fetch = (await import('node-fetch')).default;
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
  });

  const channelId = config.channelId;
  let messageId;

  async function getLavalinkStatus() {
    return new Promise((resolve) => {
      pm2.describe('Grave-Lavalink', (err, processDescription) => {
        if (err || !processDescription || processDescription.length === 0) {
          resolve('Lavalink Status: Offline ⬇️');
          return;
        }
        const status = processDescription[0].pm2_env.status;
        resolve(`Lavalink Status: ${status === 'online' ? 'Online ' : 'Offline ⬇️'}`);
      });
    });
  }

  function getDockerStatus() {
    return new Promise((resolve) => {
      exec('docker ps --filter "name=grave-grave" --format "{{.Status}}"', (error, stdout) => {
        const graveStatus = stdout.trim() ? `Grave: Online ` : 'Grave: Offline ⬇️';
        exec('docker ps --filter "name=grave-echo-grave" --format "{{.Status}}"', (error, stdout) => {
          const graveEchoStatus = stdout.trim() ? `Grave Echo: Online ` : 'Grave Echo: Offline ⬇️';
          exec('docker ps --filter "name=redis" --format "{{.Status}}"', (error, stdout) => {
            const redisStatus = stdout.trim() ? `Redis Server: Online ` : 'Redis Server: Offline ⬇️';
            resolve(`${graveStatus}\n${graveEchoStatus}\n${redisStatus}`);
          });
        });
      });
    });
  }

  async function getPostgresStatus() {
    return new Promise((resolve) => {
      exec('pg_isready', (error) => {
        resolve(error ? 'PostgreSQL Server: Offline ⬇️' : 'PostgreSQL Server: Online ');
      });
    });
  }

  async function getStatsImage() {
    try {
      const canvas = createCanvas(1600, 1200);
      const ctx = canvas.getContext('2d');
      const backgroundImage = await loadImage(path.join(__dirname, 'background.jpg'));

      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '40px Arial';
      ctx.fillText('Server Stats', 20, 40);

      const cpuInfo = await systemInformation.cpu();
      const currentLoad = await systemInformation.currentLoad();
      const memory = await systemInformation.mem();
      const memLayout = await systemInformation.memLayout();
      const driveInfo = await systemInformation.fsSize();
      const time = await systemInformation.time();
      const networkStats = await systemInformation.networkStats();

      let diskUsed = 0;
      let diskTotal = 0;

      for (const drive of driveInfo) {
        diskUsed += drive.used;
        diskTotal += drive.size;
      }

      const cpuUsage = (currentLoad.currentLoad?.toFixed(2)) || "N/A";
      const lavalinkStatus = await getLavalinkStatus();
      const dockerStatus = await getDockerStatus();
      const postgresStatus = await getPostgresStatus();

      const statsText = `
CPU: ${cpuInfo.manufacturer} ${cpuInfo.brand} (${cpuInfo.speed} GHz)
CPU Usage: ${cpuUsage}%
Cores (Physical): ${cpuInfo.physicalCores}
Cores (Total): ${cpuInfo.cores}

Total Devices: ${memLayout.length}
Current Usage: ${formatBytes(memory.active, 2).replace(" GB", "")}/${formatBytes(memory.total, 2)}

Memory Usage (w/ buffers): ${formatBytes(memory.used, 2)}
Available: ${formatBytes(memory.available, 2)}

Disk Usage: ${formatBytes(diskUsed, 2)}/${formatBytes(diskTotal, 2)}

Network Stats:
Current Transfer: ${formatBytes(networkStats[0].tx_sec, 2)}/s
Current Received: ${formatBytes(networkStats[0].rx_sec, 2)}/s
Total Transferred: ${formatBytes(networkStats[0].tx_bytes, 2)}
Total Received: ${formatBytes(networkStats[0].rx_bytes, 2)}

Uptime: ${formatUptime(time.uptime)}
${lavalinkStatus}
${dockerStatus}
${postgresStatus}
      `;

      ctx.fillText(statsText, 20, 80);

      const imagePath = path.join(__dirname, 'stats.png');
      const out = fs.createWriteStream(imagePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      return new Promise((resolve, reject) => {
        out.on('finish', () => resolve(imagePath));
        out.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating stats image:', error);
    }
  }

  function formatBytes(a, b) {
    if (0 == a) return '0 Bytes';
    const c = 1024;
    const d = b || 2;
    const e = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat((a / Math.pow(c, f)).toFixed(d)) + ' ' + e[f];
  }

  function formatUptime(o) {
    o = Number(o);
    const s = Math.floor(o / 86400);
    const n = Math.floor(o % 86400 / 3600);
    const r = Math.floor(o % 3600 / 60);
    const t = Math.floor(o % 60);
    return (s > 0 ? s + (1 == s ? ' day, ' : ' days, ') : '') +
           (n > 0 ? n + (1 == n ? ' hour, ' : ' hours, ') : '') +
           (r > 0 ? r + (1 == r ? ' minute, ' : ' minutes, ') : '') +
           (t > 0 ? t + (1 == t ? ' second' : ' seconds') : '');
  }

  client.once(Events.ClientReady, async () => {
    console.log('Bot is ready');

    const channel = client.channels.cache.get(channelId);

    if (!channel) {
      console.error('Channel not found');
      return;
    }

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const botMessages = messages.filter(msg => msg.author.id === client.user.id);

      if (botMessages.size > 0) {
        messageId = botMessages.first().id;
      }

      setInterval(async () => {
        try {
          const imagePath = await getStatsImage();
          const attachment = new AttachmentBuilder(imagePath, { name: 'stats.png' });

          if (messageId) {
            await channel.messages.edit(messageId, {
              content: 'Here are the latest server stats:',
              files: [attachment]
            });
          } else {
            const newMessage = await channel.send({
              content: 'Here are the latest server stats:',
              files: [attachment]
            });
            messageId = newMessage.id;
          }
        } catch (error) {
          console.error('Error sending or updating the message:', error);
        }
      }, 9000);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!stats' && !message.author.bot) {
      try {
        const imagePath = await getStatsImage();
        const attachment = new AttachmentBuilder(imagePath, { name: 'stats.png' });
        await message.reply({ content: 'Here are the latest server stats:', files: [attachment] });
      } catch (error) {
        console.error('Error generating stats:', error);
      }
    }
  });

  client.login(config.token);
})();
