import { MessageFlags, SlashCommandBuilder } from 'discord.js';
// import { AB_DATA } from '../initialize-data.js';
import { addStandardFormat, basicEmbed } from '../utility/format_embed.js';
import { cacheAllData } from '../utility/access_data.js'

export default {
	data: new SlashCommandBuilder()
		.setName('refresh')
		.setDescription('Refreshes data from the database.'),
	async execute(interaction) {

		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		// await AB_DATA.pullData();
		await cacheAllData(true);
		let embedMessage = basicEmbed('Refreshed', 'The bot has pulled the most recent data from the spreadsheet.');

		await interaction.editReply(
			{
				embeds: [embedMessage],
			}
		);
	},
}
