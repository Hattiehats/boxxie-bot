import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { Mun } from '../utility/classes.js';
import { basicEmbed, parseEmbedColour } from '../utility/format_embed.js';
import { getTableData } from '../utility/access_data.js';

const commandBuilder = new SlashCommandBuilder()
	.setName('remove')
	.setDescription('Remove currency from your wallet.')
	.addIntegerOption((option) =>
		option
			.setName('amount')
			.setMinValue(0)
			.setRequired(true)
			.setDescription('Amount to remove')
	)
	.addUserOption((option) =>
		option
			.setName('user')
			.setDescription('The user whose wallet you want to remove from. Defaults to you.')
	)
	.addStringOption((option) =>
		option
			.setName('currency')
			.setDescription('The kind of currency to remove')
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
 */
async function changeWallet(interaction, amount, mun, currency) {

	let actionMessage;
	const thumbnail = 'https://i.imgur.com/GKR448L.jpeg';
	let result;
	try {
		result = await mun.removeScrip(amount, currency === "tokens")
		actionMessage =
			`**\`\`\`Removed ${amount} ${currency} from ${mun.name}'s wallet.\`\`\`**`;
	}
	catch (error) {
		if (error.message === `Not enough ${currency}!`) {
			actionMessage =
				`**\`\`\`ERROR: Not enough ${currency} in ${mun.name}'s wallet, cannot remove ${amount}!\`\`\`**
            💰 **BALANCE:** \`${mun[currency]}\` ${currency}`;
		}
		else {
			throw error;
		}

	}

	const embed = basicEmbed('Manage Wallet', actionMessage, thumbnail, '', '', false)
	embed.setColor(parseEmbedColour());
	embed.setFooter({ text: `💰 NEW BALANCE: ${result} ${currency}` });

	await interaction.reply({ embeds: [embed] });
}

async function mainFunction(interaction) {

	let amount = interaction.options.getInteger('amount');

	let userOption = interaction.options.getUser('user');

	let currencyOption = interaction.options.getString('currency') ?? 'capital';

	if (userOption === null) {
		userOption = interaction.user
	}

	const allMuns = await getTableData('muns')
	const munName = allMuns.find(row => row.id === userOption.id).name
	const mun = new Mun(munName);

	await changeWallet(interaction, amount, mun, currencyOption);

}

export default {
	data: commandBuilder,
	async execute(interaction) {

		await mainFunction(interaction);

	},
}
