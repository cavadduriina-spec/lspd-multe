const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const fs = require('fs');

const TOKEN = process.env.TOKEN;

// 🔧 CONFIGURA QUI
const CHANNEL_ID = "1496125333500465162";
const ADMIN_ROLE = "1496122762354229299";

// DATABASE
const DB_FILE = "./multe.json";

let data = {};
if (fs.existsSync(DB_FILE)) {
  data = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// READY
client.once(Events.ClientReady, async () => {
  console.log(`Bot Multe Online: ${client.user.tag}`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('multa')
      .setLabel('💸 Emetti Multa')
      .setStyle(ButtonStyle.Danger)
  );

  const channel = await client.channels.fetch(CHANNEL_ID);

  await channel.send({
    content: "**💼 SISTEMA MULTE LSPD**\nUsa il bottone per emettere una multa.",
    components: [row]
  });
});

// INTERAZIONI
client.on(Events.InteractionCreate, async interaction => {

  // CLICK BOTTONE
  if (interaction.isButton()) {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE)) {
      return interaction.reply({
        content: "❌ Non autorizzato",
        ephemeral: true
      });
    }

    if (interaction.customId === "multa") {

      const modal = new ModalBuilder()
        .setCustomId("multa_form")
        .setTitle("Emissione Multa");

      const utente = new TextInputBuilder()
        .setCustomId('utente')
        .setLabel("Tag utente (@utente)")
        .setStyle(TextInputStyle.Short);

      const nome = new TextInputBuilder()
        .setCustomId('nome')
        .setLabel("Nome e Cognome")
        .setStyle(TextInputStyle.Short);

      const nascita = new TextInputBuilder()
        .setCustomId('nascita')
        .setLabel("Data di nascita")
        .setStyle(TextInputStyle.Short);

      const motivo = new TextInputBuilder()
        .setCustomId('motivo')
        .setLabel("Motivo")
        .setStyle(TextInputStyle.Paragraph);

      const importo = new TextInputBuilder()
        .setCustomId('importo')
        .setLabel("Importo (€)")
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(utente),
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(nascita),
        new ActionRowBuilder().addComponents(motivo),
        new ActionRowBuilder().addComponents(importo)
      );

      return interaction.showModal(modal);
    }
  }

  // INVIO MODULO
  if (interaction.isModalSubmit()) {

    const targetInput = interaction.fields.getTextInputValue('utente');
    const targetId = targetInput.replace(/[<@!>]/g, "");

    const nome = interaction.fields.getTextInputValue('nome');
    const nascita = interaction.fields.getTextInputValue('nascita');
    const motivo = interaction.fields.getTextInputValue('motivo');
    const importo = interaction.fields.getTextInputValue('importo');

    if (!data[targetId]) {
      data[targetId] = [];
    }

    const multa = {
      agente: interaction.user.id,
      nome,
      nascita,
      motivo,
      importo,
      data: new Date().toLocaleString()
    };

    data[targetId].push(multa);
    saveData();

    return interaction.reply({
      content: `✅ Multa registrata a <@${targetId}>`,
      ephemeral: true
    });
  }
});

client.login(TOKEN);