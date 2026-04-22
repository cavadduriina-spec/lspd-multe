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
const ADMIN_ROLE = "1496613807953416202";

// DATABASE
const DB_FILE = "./multe.json";

let data = {};

// ✅ FIX ANTI-CRASH JSON
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.log("Database corrotto, reset...");
    data = {};
  }
}

// SALVA
function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// READY
client.once(Events.ClientReady, async () => {
  console.log(`Bot Multe LSPD Online: ${client.user.tag}`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('multa')
      .setLabel('💸 Emetti Multa')
      .setStyle(ButtonStyle.Danger)
  );

  const channel = await client.channels.fetch(CHANNEL_ID);

  await channel.send({
    content: "**💼 LSPD - SISTEMA MULTE**\nSolo alto comando può usarlo.",
    components: [row]
  });
});

// INTERAZIONI
client.on(Events.InteractionCreate, async interaction => {

  // BOTTONE
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
        .setTitle("Emissione Multa LSPD");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('utente')
            .setLabel("Tag utente (@utente)")
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('nome')
            .setLabel("Nome e Cognome")
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('nascita')
            .setLabel("Data di nascita")
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('motivo')
            .setLabel("Motivo")
            .setStyle(TextInputStyle.Paragraph)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('importo')
            .setLabel("Importo (€)")
            .setStyle(TextInputStyle.Short)
        )
      );

      return interaction.showModal(modal);
    }
  }

  // MODULO
  if (interaction.isModalSubmit()) {

    if (!interaction.member.roles.cache.has(ADMIN_ROLE)) {
      return interaction.reply({ content: "❌ Non autorizzato", ephemeral: true });
    }

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