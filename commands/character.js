import { SlashCommandBuilder, EmbedBuilder, Embed, SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { addStandardFormat, basicEmbed } from '../utility/format_embed.js';
import { getTableData } from '../utility/access_data.js';
import { Character } from '../utility/classes.js';
import { fuzzyMatchOCNames } from '../utility/utils.js';

// All changeable fields: profile info + stats
const STAT_FIELDS = ['str', 'dex', 'int', 'cha', 'dur', 'res', 'mve', 'rgd', 'lck'];
const PROFILE_FIELDS = ['aka', 'age', 'gender', 'pronouns', 'height', 'birthday', 'image'];
const ALL_FIELDS = [...PROFILE_FIELDS, ...STAT_FIELDS];

/**
 * @param {Character} OC 
 * @returns {EmbedBuilder} 
 */
function createProfileEmbed(OC) {
	const embedMessage = new EmbedBuilder()
		.setTitle(OC.name)
		.addFields(
			{
				name: "",
				value: "**```\n📋 COMPANY PROXY DOSSIER \n```**",
				inline: false
			},
			{
				name: "`AGE:`",
				value: `${OC.age}`,
				inline: true
			},
			{
				name: "`PRONOUNS:`",
				value: `${OC.pronouns}`,
				inline: true
			},
			{
				name: "`GENDER:`",
				value: `${OC.gender}`,
				inline: true
			},
			{
				name: "`HEIGHT:`",
				value: `${OC.height}`,
				inline: true
			},
			{
				name: "`BIRTHDAY:`",
				value: `${OC.birthday}`,
				inline: true
			},
			{
				name: "`CONSULTANCY:`",
				value: `${OC.consultant}`,
				inline: true
			},
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
				name: "`MLE:`",
				value: `${OC.currentStats.mle}`,
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
				name: "`SKILL:`",
				value: `${OC.currentStats.special}`,
				inline: false
			},
			{
				name: "",
				value: "**```\n🗃️ OTHER\n```**",
				inline: false
			},
			{
				name: "`RECONS:`",
				value: `${OC.currentStats.recons}`,
				inline: true
			},
			{
				name: "`MUN:`",
				value: OC.mun,
				inline: true
			},
		)
		.setThumbnail(OC.image);

	if (OC.aka != "") {
		embedMessage
			.setDescription(`> ***AKA**: ${OC.aka}*`)
	}

	return addStandardFormat(embedMessage);
}

/**
 * Change any OC field (stat or profile info) and reply with a confirmation embed.
 */
async function changeField(interaction, OC, fieldName, newValue) {
	const field = fieldName.toLowerCase();
	const isStat = STAT_FIELDS.includes(field);

	if (isStat) {
		const origValue = OC.currentStats[field];
		const numValue = parseInt(newValue);
		if (isNaN(numValue)) {
			await interaction.editReply(`Stat values must be numbers! Got: \`${newValue}\``);
			return;
		}
		await OC.currentStats.setStat(field, numValue);

		let title;
		let description = `**${field.toUpperCase()}:** \`${origValue}\` ➡️ \`${OC.currentStats[field]}\`\n\n`;
		if (numValue > parseInt(origValue)) {
			title = "-# \`STAT UP ⏫\`"
			description = description + title;
		}
		else if (numValue < parseInt(origValue)) {
			title = "-# \`STAT DOWN ⏬\`"
			description = description + title;
		}
		else {
			title = "-# \`STAT UNCHANGED 🆗\`"
			description = description + title;
		}

		const embedMessage = basicEmbed(OC.name, description, OC.image);
		await interaction.editReply({ embeds: [embedMessage] });
	}
	else {
		const origValue = OC[field] || '*(empty)*';
		await OC.changeProperty(field, newValue);
		OC[field] = newValue;

		const description = `**${field.toUpperCase()}:** \`${origValue}\` ➡️ \`${newValue}\``;
		const embedMessage = basicEmbed(OC.name, description, OC.image);
		await interaction.editReply({ embeds: [embedMessage] });
	}
}

const profileSubcommand =
	new SlashCommandSubcommandBuilder()
		.setName('profile')
		.setDescription('View this OC\'s employee profile.')
		.addStringOption((option) =>
			option
				.setName('oc')
				.setDescription('OC name (shows top 25 matching names)')
				.setRequired(true)
				.setAutocomplete(true)
		);

const changeSubcommand =
	new SlashCommandSubcommandBuilder()
		.setName('change')
		.setDescription('Change any field on this OC (stats or profile info).')
		.addStringOption((option) =>
			option
				.setName('oc')
				.setDescription('OC name (shows top 25 matching names)')
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addStringOption((option) =>
			option
				.setName('field')
				.setDescription('The field you want to change.')
				.setChoices(
					{ name: 'AKA', value: 'aka' },
					{ name: 'Age', value: 'age' },
					{ name: 'Gender', value: 'gender' },
					{ name: 'Pronouns', value: 'pronouns' },
					{ name: 'Height', value: 'height' },
					{ name: 'Birthday', value: 'birthday' },
					{ name: 'Image', value: 'image' },
					{ name: 'STR', value: 'str' },
					{ name: 'DEX', value: 'dex' },
					{ name: 'INT', value: 'int' },
					{ name: 'CHA', value: 'cha' },
					{ name: 'DUR', value: 'dur' },
					{ name: 'RES', value: 'res' },
					{ name: 'MLE', value: 'mle' },
					{ name: 'RGD', value: 'rgd' },
					{ name: 'LCK', value: 'lck' },
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('new-value')
				.setDescription('The new value for this field.')
				.setRequired(true)
		);

const data = new SlashCommandBuilder()
	.setName('oc')
	.setDescription('Commands related to an OC.')
	.addSubcommand(profileSubcommand)
	.addSubcommand(changeSubcommand);

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
			await interaction.editReply(`${characterChoice} not found. Please use the autocomplete to select your OC.`);
			return;
		}

		if (interaction.options.getSubcommand() === 'profile') {
			await interaction.editReply(
				{ embeds: [createProfileEmbed(characterInfo)] }
			);
		}
		else if (interaction.options.getSubcommand() === 'change') {
			const field = interaction.options.getString('field');
			const newValue = interaction.options.getString('new-value');
			await changeField(interaction, characterInfo, field, newValue);
		}

	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = fuzzyMatchOCNames(focusedValue, 25);
		await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
	},
	async executePrefix(message, args) {
		if (!args) {
			await message.reply('Usage: `!oc <name>`, `!oc profile <name>`, `!oc change <name> <field> <value>`');
			return;
		}
		const parts = args.split(/\s+/);
		let subcommand = parts[0]?.toLowerCase();
		let characterName;
		const subcommands = ['profile', 'change'];
		if (!subcommands.includes(subcommand)) {
			subcommand = 'profile';
			characterName = args.trim();
		} else {
			characterName = parts.slice(1).join(' ');
		}
		if (subcommand === 'change') {
			// Usage: !oc change <name> <field> <value>
			if (parts.length < 4) {
				await message.reply('Usage: `!oc change <name> <field> <value>`\nFields: ' + ALL_FIELDS.join(', '));
				return;
			}
			const newValue = parts[parts.length - 1];
			const field = parts[parts.length - 2]?.toLowerCase();
			if (!ALL_FIELDS.includes(field)) {
				await message.reply(`Unknown field \`${field}\`. Valid fields: ${ALL_FIELDS.join(', ')}`);
				return;
			}
			characterName = parts.slice(1, -2).join(' ');
			let characterInfo;
			try {
				characterInfo = new Character(characterName);
			} catch {
				await message.reply(`I couldn't find an OC named "${characterName}".`);
				return;
			}

			const isStat = STAT_FIELDS.includes(field);
			if (isStat) {
				const numValue = parseInt(newValue);
				if (isNaN(numValue)) {
					await message.reply(`Stat values must be numbers! Got: \`${newValue}\``);
					return;
				}
				const origValue = characterInfo.currentStats[field];
				await characterInfo.currentStats.setStat(field, numValue);
				let description = `**${field.toUpperCase()}:** \`${origValue}\` ➡️ \`${characterInfo.currentStats[field]}\`\n\n`;
				if (numValue > parseInt(origValue)) {
					description += "-# \`STAT UP ⏫\` *yippee!*";
				} else if (numValue < parseInt(origValue)) {
					description += "-# \`STAT DOWN ⏬\` *tough break...*";
				} else {
					description += "-# \`STAT 🆗\` *Must have been the wind...*";
				}
				const embed = basicEmbed(characterInfo.name, description, characterInfo.image);
				await message.reply({ embeds: [embed] });
			} else {
				const origValue = characterInfo[field] || '*(empty)*';
				await characterInfo.changeProperty(field, newValue);
				const description = `**${field.toUpperCase()}:** \`${origValue}\` ➡️ \`${newValue}\``;
				const embed = basicEmbed(characterInfo.name, description, characterInfo.image);
				await message.reply({ embeds: [embed] });
			}
		} else {
			let characterInfo;
			try {
				characterInfo = new Character(characterName);
			} catch {
				await message.reply(`I couldn't find an OC named "${characterName}".`);
				return;
			}
			await message.reply({ embeds: [createProfileEmbed(characterInfo)] });
		}
	},
}
