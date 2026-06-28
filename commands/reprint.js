import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Character, getFlavorText } from '../utility/classes.js';
import { getTableData } from '../utility/access_data.js';
import { fuzzyMatchOCNames } from '../utility/utils.js';
import { basicEmbed } from '../utility/format_embed.js';
// import { AB_DATA } from '../initialize-data.js';

// let compMessage = AB_DATA.getFlavorText("Reprint_Warning");

// let compPrintError = AB_DATA.getFlavorText("Reprint_Error")
// let ocName;

// await AB_DATA.pullData();

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

async function reprintMessage(interaction) {
	await interaction.deferReply();
	let error = false;
	const ocName = interaction.options.getString("oc");

	const reprintContent = `### ${ocName} has been reconneded without error. Congratulations!`;
	const errorContent = `\`\`\`While reconstructing ${ocName}, something went wrong! They've had a RECON ERROR. You may decide the error for yourself, or you may roll 1d10 to pick an error from this table. Effects may be flavored however you like.\`\`\`\n**You come back from the recon process...**\n> \`1.)\` - With a different hair and/or eye color.\n> \`2.)\` - 1d6 inches shorter.\n> \`3.)\` - 1d6 inches taller.\n> \`4.)\` - Differently colored blood.\n> \`5.)\` - With impaired functioning in part of their body.\n> \`6.)\` - With a seemingly permanent illness they didn't have before. \n> \`7.)\` - With sudden chronic pain.\n> \`8.)\` - With personality change. (Less irritable, etc.)\n> \`9.)\` - With a gap in their memory.\n> \`10.)\` - Missing part of their body.\`\`\`This error will impact you until your next recon.\`\`\``;
	const reprintConfirmMessage = [
		new ContainerBuilder()
			.setAccentColor(11326574)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(reprintContent),
			)
	];

	const errorMessage = [
		new ContainerBuilder()
			.setAccentColor(11326574)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(errorContent),
			)
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
