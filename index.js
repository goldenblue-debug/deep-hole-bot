// 🌿 .env 로드
require('dotenv').config();
console.log('디버깅 - TOKEN:', process.env.TOKEN);

// 🌐 Express keep-alive 웹서버
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('봇이 살아있습니다! 🟢');
});

app.listen(port, () => {
  console.log(`🌐 웹서버 실행 중: http://localhost:${port}`);
});

// 💬 Discord 봇 구성
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// 🔐 환경변수
const TOKEN = process.env.TOKEN;
const ROLE_NAME = process.env.ROLE_NAME;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const GUI_IDENTIFIER = process.env.GUI_IDENTIFIER;

client.once('ready', () => {
  console.log(`✅ 로그인됨: ${client.user.tag}`);
});

// 📌 GUI 버튼 메시지 자동 최신화
client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== TARGET_CHANNEL_ID) return;

  const channel = message.channel;
  const messages = await channel.messages.fetch({ limit: 10 });
  const lastMessage = messages.first();
  const guiMessage = messages.find(
    (m) => m.author.id === client.user.id && m.content.includes(GUI_IDENTIFIER)
  );

  if (
    lastMessage.author.id !== client.user.id ||
    !lastMessage.content.includes(GUI_IDENTIFIER)
  ) {
    if (guiMessage) await guiMessage.delete().catch(() => {});

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('goddess').setLabel('여신의 뜰').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ice_valley').setLabel('얼음 협곡').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('alert_on').setLabel('알림 ON').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('alert_off').setLabel('알림 OFF').setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `**📢 ${GUI_IDENTIFIER}**

🔔 아래 버튼을 통해 **알림 설정을 켜거나 끌 수 있어요.**
- \`알림 ON\` ▶️ 심층 구멍이 발견되면 멘션을 받습니다.
- \`알림 OFF\` 🚫 알림을 더 이상 받지 않습니다.

📍 또한, 심층 구멍을 발견한 경우 **사냥터 버튼을 눌러 제보할 수 있어요!**
- \`여신의 뜰\` 🌸 ▶️ 제보 멘션 전송
- \`얼음 협곡\` ❄️ ▶️ 제보 멘션 전송

언제든 제보와 설정을 편하게 해주세요! 🙌`,
      components: [row],
    });
  }
});

// 🔘 버튼 반응 처리
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const mention = `<@${interaction.user.id}>`;
  let role = interaction.guild.roles.cache.find((r) => r.name === ROLE_NAME);

  if (!role) {
    role = await interaction.guild.roles.create({
      name: ROLE_NAME,
      mentionable: true,
      reason: '심층구멍 알림 역할 생성',
    });
  }

  const channel = interaction.channel;

  switch (interaction.customId) {
    case 'goddess':
      await interaction.reply({ content: '✅ 알림이 전송되었습니다.', flags: 1 << 6 });
      await channel.send({
        content: `${role}`,
        embeds: [
          {
            title: '🌸 여신의 뜰 심층 구멍 발견!',
            description: `제보자: ${mention}`,
            color: 0xf2c1f2,
            image: {
              url: 'https://i.namu.wiki/i/9FHvp5Vu9nIsbgEZnNH0-8pwH63_COL78LwbvdC5o8BfoxRpJ3luVr59nnucURt0AKNHbwT740ahgFE3O9V0b3YIDdGz1o67htq8nsKpawaAG6ooy40SPsaGSzh64ft6ZPGC6yjlCzn7hjvA6aR0VQ.webp',
            },
            footer: {
              text: '제보 감사합니다!',
            },
            timestamp: new Date(),
          },
        ],
        allowedMentions: { roles: [role.id], users: [interaction.user.id] },
      });
      break;

    case 'ice_valley':
      await interaction.reply({ content: '✅ 알림이 전송되었습니다.', flags: 1 << 6 });
      await channel.send({
        content: `${role}`,
        embeds: [
          {
            title: '❄️ 얼음 협곡 심층 구멍 발견!',
            description: `제보자: ${mention}`,
            color: 0xadd8e6,
            image: {
              url: 'https://i.namu.wiki/i/_N7djvL0SeCBhviyG0pPvNbWk45heD6TIakfzCM_u15qhQhKXOx9gpOwWXfN_11rvKcOgBn0Zg-9PiUK4iaSAonjWqlsjtskwQTmuBKehsfhsSY17LJM7hzbBaaR0opn5AK2chNDXyEDTeg6A_BhsA.webp',
            },
            footer: {
              text: '제보 감사합니다!',
            },
            timestamp: new Date(),
          },
        ],
        allowedMentions: { roles: [role.id], users: [interaction.user.id] },
      });
      break;

    case 'alert_on':
      if (member.roles.cache.has(role.id)) {
        await interaction.reply({ content: '이미 역할이 있습니다!', flags: 1 << 6 });
      } else {
        await member.roles.add(role);
        await interaction.reply({ content: '✅ 알림 역할이 부여되었습니다.', flags: 1 << 6 });
      }
      break;

    case 'alert_off':
      if (!member.roles.cache.has(role.id)) {
        await interaction.reply({ content: '역할이 없습니다.', flags: 1 << 6 });
      } else {
        await member.roles.remove(role);
        await interaction.reply({ content: '🚫 알림 역할이 해제되었습니다.', flags: 1 << 6 });
      }
      break;
  }
});

client.login(TOKEN);
