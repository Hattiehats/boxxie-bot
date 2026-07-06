import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { basicEmbed } from '../utility/format_embed.js';
import { getTableData } from '../utility/access_data.js';

const PAGE_SIZE = 25;
const MEDALS = ['🥇', '🥈', '🥉'];

function parseScrip(scrip) {
	if (typeof scrip === 'string') {
		return parseInt(scrip.replaceAll(',', '').replace('scrip', '').trim()) || 0;
	}
	if (typeof scrip === 'number') return Math.round(scrip);
	return 0;
}

function formatScrip(amount) {
	return amount.toLocaleString('en-US');
}

function getSortedMuns(muns) {
	return muns
		.filter(m => m.status === 'Active')
		.map(m => ({ name: m.name, capital: parseScrip(m.capital) }))
		.sort((a, b) => b.capital - a.capital);
}

function buildPage(sorted, pageNum) {
	const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
	const start = (pageNum - 1) * PAGE_SIZE;
	const chunk = sorted.slice(start, start + PAGE_SIZE);

	const lines = chunk.map((entry, idx) => {
		const rank = start + idx + 1;
		const prefix = rank <= 3 ? MEDALS[rank - 1] : `\`${rank}.\``;
		return `${prefix}  **${entry.name}** — \`${entry.capital}\` capital`;
	});

	const title = totalPages > 1
		? `💰 Capital Leaderboard (${pageNum}/${totalPages})`
		: '💰 Capital Leaderboard';

	const embed = basicEmbed(title, lines.join('\n'));

	const buttons = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('lb_prev')
			.setLabel('‹ Back')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(pageNum === 1),
		new ButtonBuilder()
			.setCustomId('lb_next')
			.setLabel('Next ›')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(pageNum === totalPages),
	);

	const payload = { embeds: [embed] };
	if (totalPages > 1) payload.components = [buttons];
	return payload;
}

async function handlePagination(sorted, pageNum, reply, interaction) {
	const collectorFilter = (i) => i.user.id === interaction.user.id;
	try {
		const response = await reply.awaitMessageComponent({
			filter: collectorFilter,
			time: 120_000,
		});

		if (response.customId === 'lb_next') pageNum++;
		else if (response.customId === 'lb_prev') pageNum--;

		const newReply = await response.update(buildPage(sorted, pageNum));
		await handlePagination(sorted, pageNum, newReply, interaction);
	} catch {
		// Timeout — remove buttons
		await interaction.editReply({ components: [] });
	}
}

export default {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View the Capital leaderboard.'),
	async execute(interaction) {
		await interaction.deferReply();
		const allMuns = await getTableData('muns');
		const sorted = getSortedMuns(allMuns);

		if (sorted.length === 0) {
			const embed = basicEmbed('💰 Capital Leaderboard', 'No active members found. 🫗');
			await interaction.editReply({ embeds: [embed] });
			setTimeout(() => interaction.deleteReply().catch(() => { }), 300_000);
			return;
		}

		const reply = await interaction.editReply(buildPage(sorted, 1));
		setTimeout(() => interaction.deleteReply().catch(() => { }), 300_000);

		if (Math.ceil(sorted.length / PAGE_SIZE) > 1) {
			await handlePagination(sorted, 1, reply, interaction);
		}
	}
};
