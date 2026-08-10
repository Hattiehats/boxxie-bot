import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Mun } from '../utility/classes.js';
import { basicEmbed, parseEmbedColour } from '../utility/format_embed.js';
import { getTableData } from '../utility/access_data.js';

const commandBuilder = new SlashCommandBuilder()
	.setName('add')
	.setDescription('Add a currency to your wallet')
	.addIntegerOption((option) =>
		option
			.setName('amount')
			.setMinValue(0)
			.setRequired(true)
			.setDescription('Amount to add')
	)
	.addUserOption((option) =>
		option
			.setName('user')
			.setDescription('The user whose wallet you want to add to. Defaults to you.')
	)
	.addStringOption((option) =>
		option
			.setName('currency')
			.setDescription('The kind of currency to add')
			.addChoices(
				{ name: "Capital", value: "capital" },
				{ name: "LLT", value: "tokens" },
			)
	)

/**
 * change wallet amount
 *
 * @param {CommandInteraction} interaction 
 * @param {string} action - what to do 
 * @param {number} amount - amount to change by
 * @param {Mun} mun - Mun to affect
 * @param {string} currency - the type of currency
 */
async function changeWallet(interaction, amount, mun, currency) {

	let actionMessage;
	const thumbnail = 'https://i.imgur.com/GKR448L.jpeg';

	const result = await mun.addScrip(amount, currency === "tokens")
	if (currency === "tokens") {
		await mun.addTeamPoints(amount)
	}
	actionMessage =
		`**\`\`\`Added ${amount} ${currency} to ${mun.name}'s wallet.\`\`\`**`;

	const embed = basicEmbed('Manage Wallet', actionMessage, thumbnail, '', '', false)
	embed.setColor(parseEmbedColour());
	embed.setFooter({ text: `💰 NEW BALANCE: ${result} ${currency}` });

	await interaction.reply({ embeds: [embed] });
}

async function mainFunction(interaction) {

	let amount = interaction.options.getInteger('amount');

	let userOption = interaction.options.getUser('user');

	if (userOption === null) {
		userOption = interaction.user
	}

	const currency = interaction.options.getString("currency") ?? "capital";
	const allMuns = await getTableData('muns')
	const munName = allMuns.find(row => row.id === userOption.id).name
	const mun = new Mun(munName);

	await changeWallet(interaction, amount, mun, currency);

}

export default {
	data: commandBuilder,
	async execute(interaction) {

		await mainFunction(interaction);

	},
}
