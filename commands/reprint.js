import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Character, getFlavorText } from '../utility/classes.js';
import { getTableData } from '../utility/access_data.js';
import { fuzzyMatchOCNames } from '../utility/utils.js';
import { embedColour, basicEmbed } from '../utility/format_embed.js';
import { getCustomCommandContent, customCommandExists } from '../utility/custom_commands.js';
// import { AB_DATA } from '../initialize-data.js';

// let compMessage = AB_DATA.getFlavorText("Reprint_Warning");

// let compPrintError = AB_DATA.getFlavorText("Reprint_Error")
// let ocName;

// await AB_DATA.pullData();

const RECON_ERR = 'recon_error';

const cancelComponent = [
	new ContainerBuilder()
		.setAccentColor(11326574)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("### 🗑️ Recon was cancelled!"),
		),
];

function setComponent(ocName) {
	let compMessage = getFlavorText('Reprint_Warning')
	let compPrintError = getFlavorText('Reprint_Error')
	compMessage = compMessage.replace("[OC_NAME]", ocName);
	compPrintError = compPrintError.replace("[OC_NAME]", ocName)

	const components = [
		new ContainerBuilder()
			.setAccentColor(11326574)
			.addSectionComponents(
				new SectionBuilder()
					.setThumbnailAccessory(
						new ThumbnailBuilder()
							.setURL("https://images.unsplash.com/photo-1605364850023-a917c39f8fe9?q=80&w=1201&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("## RECON?"),
						new TextDisplayBuilder().setContent(compMessage),
					),
			),
		new ContainerBuilder()
			.setAccentColor(11326574)
			.addActionRowComponents(
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Primary)
							.setLabel("Recon")
							.setEmoji({
								name: "🖨️",
							})
							.setCustomId("confirm"),
						new ButtonBuilder()
							.setStyle(ButtonStyle.Secondary)
							.setLabel("Never mind")
							.setEmoji({
								name: "🚫",
							})
							.setCustomId("cancel"),
					),
			),
	];

	return components;
}

async function getReconError() {
	if (!customCommandExists(RECON_ERR)) return null;
	const result = await getCustomCommandContent(RECON_ERR);
	return result.content || null;
}

const DEFAULT_ERROR_TABLE = `[**METANARRATIVE DISSONANCE**]: Overcome with dizziness and agonizing head pain, collapsing to the floor of the reconstruction chamber, you suddenly realise this body belongs to one of your parallel selves. The reality of your multiversal body snatching only has a moment to set in as the pain of being alive again pulls the thought away like a bad dream.`;

async function createReconPreamble(ocName) {

	const preamble = `\`\`\`ini
As the door of the reconstruction pod rumbles open and the light hits your eyes, something feels wrong - *you* feel [WRONG]. 

Something [TERRIBLE?] [WONDERFUL?] has happened.

${ocName} has experienced an [ECTOPIC EXPRESSION]. Please either roll a [d5] to choose randomly from the list below, or select whichever one you like. This will affect you until your next reconstruction.\`\`\``;
	return new ContainerBuilder()
		.setAccentColor(embedColour(false))
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(preamble)
		);
}

function createReconPostLude() {
	return new ContainerBuilder()
		.setAccentColor(embedColour(false))
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`\`\`\`ini
You should check in with [DR. FUCHES] if you can, then head to [HR]… you have paperwork to sign.\`\`\``
			)
		)
}


async function reprintMessage(interaction) {
	await interaction.deferReply();
	let error = false;
	const ocName = interaction.options.getString("oc");

	const reprintContent = `### ${ocName} has been cleanly reconstructed. Please resume your duties.`;
	const errorContent = await getReconError() ?? DEFAULT_ERROR_TABLE;
	const reprintConfirmMessage = [
		new ContainerBuilder()
			.setAccentColor(embedColour(true))
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(reprintContent),
			)
	];

	const errorMessage = [
		await createReconPreamble(ocName),
		new ContainerBuilder()
			.setAccentColor(embedColour(true))
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(errorContent),
			),

		createReconPostLude()
	];
	try {

		const characterObject = new Character(ocName);
		error = await characterObject.reprint();
	} catch (err) {
		console.log("ERROR IN RECON");
		console.log(err);
	}
	if (error) {
		await interaction.editReply({
			components: errorMessage,
			flags: [MessageFlags.IsComponentsV2],
		});
	} else {
		await interaction.editReply({
			components: reprintConfirmMessage,
			flags: [MessageFlags.IsComponentsV2],
		});
	}
}

const data = new SlashCommandBuilder()
	.setName('reconstruct')
	.setDescription('Reconstructs your character')
	.addStringOption((option) =>
		option
			.setName('oc')
			.setDescription('OC name (shows top 25 matching names)')
			.setRequired(true)
			.setAutocomplete(true)
	);

export default {
	data: data,
	async execute(interaction) {
		await reprintMessage(interaction);
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = fuzzyMatchOCNames(focusedValue, 25);
		await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
	}
}
