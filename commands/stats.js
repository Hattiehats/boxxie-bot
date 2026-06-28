import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTableData } from '../utility/access_data.js';
import { Character } from '../utility/classes.js';
import { fuzzyMatchOCNames, pickOne } from '../utility/utils.js';
import { parseEmbedColour, potentialFooterTexts } from '../utility/format_embed.js';

function viewStats(OC) {
	const embedMessage = new EmbedBuilder()
		.setTitle(OC.name)
		.setAuthor({
			name: "LINNE CO EMPLOYEE MEDICAL REPORT",
			iconURL: "https://thumbs2.imgbox.com/6c/bc/2MkLHEGP_t.png",
		})
		.setColor(parseEmbedColour())
		.setFields(
			{
				name: "",
				value: "**```\n🎲 CURRENT STATS\n```**",
				inline: false
			},
			{
				name: "`STR:`",
				value: `${OC.currentStats.str}`,
				inline: true
			},
			{
				name: "`DEX:`",
				value: `${OC.currentStats.dex}`,
				inline: true
			},
			{
				name: "`INT:`",
				value: `${OC.currentStats.int}`,
				inline: true
			},
			{
				name: "`CHA:`",
				value: `${OC.currentStats.cha}`,
				inline: true
			},
			{
				name: "`DUR:`",
				value: `${OC.currentStats.dur}`,
				inline: true
			},
			{
				name: "`RES:`",
				value: `${OC.currentStats.res}`,
				inline: true
			},
			{
				name: "`RGD:`",
				value: `${OC.currentStats.rgd}`,
				inline: true
			},
			{
				name: "`LCK:`",
				value: `${OC.currentStats.lck}`,
				inline: true
			},
			{
				name: "`SPECIAL:`",
				value: `${OC.currentStats.special}`,
				inline: false
			},
			{
				name: "",
				value: `**\`\`\`\n🖨️ REPRINTS: ${OC.currentStats.reprints}\n\`\`\`**`,
				inline: false
			},
		)
		.setFooter({ text: pickOne(potentialFooterTexts) });

	return embedMessage;
}

const data = new SlashCommandBuilder()
	.setName('stats')
	.setDescription('View an OC\'s current stats.')
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
		await interaction.deferReply();
		const characterChoice = interaction.options.getString("oc");
		let characterInfo;

		try {
			characterInfo = new Character(characterChoice);
		}
		catch {
			await interaction.editReply(`I couldn't find an OC named ${characterChoice} :( Please use the autocomplete to select your OC.`);
			return;
		}

		await interaction.editReply({ embeds: [viewStats(characterInfo)] });
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = fuzzyMatchOCNames(focusedValue, 25);
		await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
	},
	async executePrefix(message, args) {
		if (!args) {
			await message.reply('Usage: `!stats <name>`');
			return;
		}
		let characterInfo;
		try {
			characterInfo = new Character(args.trim());
		} catch {
			await message.reply(`I couldn't find an OC named "${args.trim()}".`);
			return;
		}
		await message.reply({ embeds: [viewStats(characterInfo)] });
	},
}
