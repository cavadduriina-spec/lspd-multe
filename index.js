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
const LOG_CHANNEL_ID = "1496616270265581641";
const ADMIN_ROLE = "1496613807953416202";

// DATABASE
const DB_FILE = "./multe.json";

let data = {};

// FIX JSON
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    data = raw ? JSON.parse(raw) : {};
  } catch {
    console.log("Database corrotto, reset...");
    data = {};
  }
}

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
      .setLabel('💸 Fai Multa')
      .setStyle(ButtonStyle.Danger)
  );

  const ch = await client.channels.fetch(CHANNEL_ID);

  await ch.send({
    content: "**💼 LSPD - MULTE**\nPremi il bottone per fare una multa.",
    components: [row]
  });
});

// INTERAZIONI
client.on(Events.InteractionCreate, async interaction => {

  // BOTTONE
  if (interaction.isButton()) {
    if (interaction.customId === "multa") {

      const modal = new ModalBuilder()
        .setCustomId("multa_form")
        .setTitle("Verbale Multa LSPD");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('utente')
            .setLabel("Tag collega coinvolto (@utente)")
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

    const targetInput = interaction.fields.getTextInputValue('utente');
    const targetId = targetInput.replace(/[<@!>]/g, "");

    const nome = interaction.fields.getTextInputValue('nome');
    const nascita = interaction.fields.getTextInputValue('nascita');
    const motivo = interaction.fields.getTextInputValue('motivo');
    const importo = interaction.fields.getTextInputValue('importo');

    if (!data[targetId]) data[targetId] = [];

    const multa = {
      agente: interaction.user.id,
      collega: targetId,
      nome,
      nascita,
      motivo,
      importo,
      data: new Date().toLocaleString()
    };

    data[targetId].push(multa);
    saveData();

    // INVIO LOG
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    await logChannel.send(`
 **MULTA LSPD**

👮 Agente: <@${interaction.user.id}>
 Collega Pattuglia: <@${targetId}>

📄 Nome: ${nome}
📅 Data nascita: ${nascita}
💸 Importo: ${importo}€
📝 Motivo: ${motivo}

 Multa eseguita da <@${interaction.user.id}> con <@${targetId}>

<@&${ADMIN_ROLE}>
`);

    return interaction.reply({
      content: " Multa mandata",
      ephemeral: true
    });
  }
});

client.login(TOKEN);