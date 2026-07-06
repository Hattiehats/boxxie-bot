import { SlashCommandBuilder } from 'discord.js';
import { getTableData } from '../utility/access_data.js';
import { Mun } from '../utility/classes.js';
import { fuzzyMatchOnTable } from '../utility/utils.js';
import { basicEmbed, parseEmbedColour } from '../utility/format_embed.js';

// Maps shorthand command names → mechanics table "type" values
const TYPE_ALIASES = {
	'words': 'Words',
	'writing': 'Words',
	'headsketch': 'Headshot, sketch',
	'headrefined': 'Headshot, refined',
	'headrendered': 'Headshot, rendered',
	'halfsketch': 'Halfbody, sketch',
	'halfrefined': 'Halfbody, refined',
	'halfrendered': 'Halfbody, rendered',
	'fullsketch': 'Fullbody, sketch',
	'fullrefined': 'Fullbody, refined',
	'fullrendered': 'Fullbody, rendered',
	'prop': 'Prop',
	'npc': 'NPC multiplier',
	'bg': 'BG multiplier',
	'commission': 'Commission',
};

const commandBuilder = new SlashCommandBuilder()
	.setName('submit')
	.setDescription('Submit art, writing, or other work for Capital or LLT')
	.addStringOption((option) =>
		option.setName('submission')
			.setDescription('e.g. "fullrendered 3 bg, words 1000, commission 2"')
			.setRequired(true)
			.setAutocomplete(true)
	)
	.addIntegerOption((option) =>
		option
			.setName('count')
			.setDescription('Number to log. Should be word count or number of images')
			.setRequired(true)
			.setMinValue(1)
	)
	.addStringOption((option) =>
		option.setName('multiplier')
			.setDescription("A multiplier, if any")
			.setRequired(false)
			.setAutocomplete(true)
	)
	.addUserOption(option =>
		option.setName('user')
			.setDescription('The user to submit for. Defaults to you.')
	);

/** Parse a rate string like "10.00 scrip" into a number */
function parseRate(rateStr) {
	return parseFloat(String(rateStr).replace(/[^0-9.\-]/g, ''));
}

/**
 * Parse a full submission string into entries with calculated payouts.
 * Format: "type [quantity] [multipliers], type [quantity] [multipliers], ..."
 * Multipliers (bg, npc) multiply the base payout of the segment they're attached to.
 */
function parseSubmission(submissionStr) {
	const mechanics = getTableData('mechanics');
	const segments = submissionStr.split(',');
	const entries = [];

	for (const segment of segments) {
		const tokens = segment.trim().split(/\s+/).filter(t => t.length > 0);
		if (tokens.length === 0) continue;

		// First token = submission type
		const typeName = tokens[0].toLowerCase();
		const baseType = TYPE_ALIASES[typeName];
		if (!baseType) return { error: `Unknown submission type: **${tokens[0]}**\nUse \`/submit\` with no arguments to see valid types.` };

		const baseData = mechanics.find(m => m.type === baseType);
		if (!baseData) return { error: `No rate found for: **${baseType}**` };

		const rate = parseRate(baseData.rate);
		const category = (baseData.category || '').toLowerCase();

		// Multipliers can't be standalone — they need art to multiply
		if (category === 'multiplier') {
			return { error: `**${tokens[0]}** is a multiplier — add it after an art type!\nExample: \`fullrendered 2 ${typeName}\`` };
		}

		// Second token = quantity (defaults to 1)
		let quantity = 1;
		let modifierStart = 1;
		if (tokens.length > 1 && !isNaN(tokens[1])) {
			quantity = parseInt(tokens[1]);
			modifierStart = 2;
		}

		const basePayout = rate * quantity;

		// Remaining tokens = multipliers
		let multiplierProduct = 1;
		const appliedModifiers = [];

		for (let i = modifierStart; i < tokens.length; i++) {
			const modName = tokens[i].toLowerCase();
			const modType = TYPE_ALIASES[modName];
			if (!modType) return { error: `Unknown modifier: **${tokens[i]}**` };

			const modData = mechanics.find(m => m.type === modType);
			if (!modData) return { error: `No rate found for: **${modType}**` };

			const modCategory = (modData.category || '').toLowerCase();
			if (modCategory !== 'multiplier') {
				return { error: `**${tokens[i]}** can't be used as a modifier — submit it as a separate entry!` };
			}

			multiplierProduct *= parseRate(modData.rate);
			appliedModifiers.push(modType);
		}

		const segmentPayout = Math.round(basePayout * multiplierProduct);
		entries.push({
			type: baseType,
			quantity,
			rate,
			modifiers: appliedModifiers,
			totalPayout: segmentPayout,
		});
	}

	if (entries.length === 0) {
		return { error: 'No valid submissions found.' };
	}

	const totalPayout = entries.reduce((sum, e) => sum + e.totalPayout, 0);
	return { entries, totalPayout };
}

/** Format a human-readable breakdown of the submission */
function formatBreakdown(entries, totalPayout) {
	const lines = [];
	for (const entry of entries) {
		let label = `${entry.type} × ${entry.quantity}`;
		if (entry.modifiers.length > 0) {
			const modNames = entry.modifiers.map(m => {
				if (m.includes('NPC')) return 'NPC';
				if (m.includes('BG')) return 'BG';
				return m;
			});
			label += ` (${modNames.join(', ')})`;
		}
		lines.push(`${label} = ${entry.totalPayout.toLocaleString()} scrip`);
	}
	if (entries.length > 1) {
		lines.push('───────────────────────');
		lines.push(`TOTAL = ${totalPayout.toLocaleString()} scrip`);
	}
	return lines.join('\n');
}

async function mainFunction(replyTarget, submissionStr, targetUser) {
	const result = parseSubmission(submissionStr);
	if (result.error) {
		const errEmbed = basicEmbed('', result.error, '', '', '', false);
		errEmbed.setColor("#e74c3c");
		await replyTarget.reply({ embeds: [errEmbed], ephemeral: true });
		return;
	}

	const { entries, totalPayout } = result;

	const allMuns = getTableData('muns');
	const munData = allMuns.find(row => row.id === targetUser.id);
	if (!munData) {
		await replyTarget.reply({ content: "Couldn't find that user's profile!", ephemeral: true });
		return;
	}

	const thisMun = new Mun(munData.name);
	await thisMun.addScrip(totalPayout);
	await thisMun.addTeamPoints(totalPayout);

	const breakdown = formatBreakdown(entries, totalPayout);
	const message =
		`**\`\`\`${breakdown}\n\nAdded ${totalPayout.toLocaleString()} scrip to ${thisMun.name}'s wallet!\`\`\`**`;
	const embed = basicEmbed('', message, '', '', '', false);
	embed.setColor(parseEmbedColour());
	embed.setFooter({ text: `💰 NEW BALANCE: ${thisMun.scrip} scrip` });

	await replyTarget.reply({ embeds: [embed] });
}

export default {
	data: commandBuilder,
	async execute(interaction) {
		const submissionStr = interaction.options.getString('submission');
		const targetUser = interaction.options.getUser('user') || interaction.user;
		await mainFunction(interaction, submissionStr, targetUser);
	},
	async autocomplete(interaction) {
		const focusValue = interaction.options.getFocused(true);
		const filter = fuzzyMatchOnTable(focusValue.value, 25, 'mechanics', 'type')
		await interaction.respond(filter
			.filter(option => option)
			.map((choice) => ({ name: choice, value: choice })));
	}
}
