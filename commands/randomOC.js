import { SlashCommandBuilder, EmbedBuilder, Client } from 'discord.js';
// import { AB_DATA } from '../initialize-data.js';
import { addStandardFormat } from '../utility/format_embed.js';
import { getTableData, getData } from '../utility/access_data.js';
import { Character } from '../utility/classes.js';

export default {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Replies with a random OC\'s name.')
		.addStringOption((option) =>
			option
				.setName('pick')
				.setDescription('Get a random OC or pair of two OCs.')
				.setRequired(true)
				.addChoices(
					{
						name: 'OC',
						value: 'oc'
					},
					{
						name: 'Pairing',
						value: 'pairing'
					})
		),
	async execute(interaction) {

		const choice = interaction.options.getString('pick');

		let characterNames = getTableData('ocs')
		characterNames = characterNames.filter((row) => {
			const munData = getData("muns", "name", row.mun);
			return (row.name !== 'Test Character' &&
				!!munData &&
				munData.status !== 'Archived');
		}).map(row => row.name);
		const ocNamesLength = characterNames.length;
		const randomNumber = Math.floor(Math.random() * ocNamesLength);
		const character = new Character(characterNames[randomNumber]);

		let embedMessage;
		if (choice === 'oc') {
			embedMessage = new EmbedBuilder()
				.setTitle('OC Selection (Random)')
				.setDescription(`**SELECTED: ${character.name}!**`)
				.setThumbnail(character.image)

		} else {
			let secondNumber = Math.floor(Math.random() * ocNamesLength);
			if (secondNumber === randomNumber) { secondNumber += 1 }
			const character2 = new Character(characterNames[secondNumber]);

			embedMessage = new EmbedBuilder()
				.setTitle('OC SELECTION (Pairing)')
				.setDescription(`SELECTED: **${character.name}** AND **${character2.name}!**`)
		}

		embedMessage = addStandardFormat(embedMessage);
		await interaction.reply(
			{ embeds: [embedMessage] }
		);
	},
	async executePrefix(message, args) {
		const choice = args?.toLowerCase()?.trim();
		let characterNames = getTableData('ocs');
		characterNames = characterNames.filter((row) => {
			const munData = getData("muns", "name", row.mun);
			return (row.name !== 'Test Character' &&
				!!munData &&
				munData.status !== 'Archived');
		}).map(row => row.name);
		const randomNumber = Math.floor(Math.random() * characterNames.length);
		const character = new Character(characterNames[randomNumber]);
		let embedMessage;
		if (choice === 'pairing') {
			let secondNumber = Math.floor(Math.random() * characterNames.length);
			if (secondNumber === randomNumber) secondNumber = (secondNumber + 1) % characterNames.length;
			const character2 = new Character(characterNames[secondNumber]);
			embedMessage = new EmbedBuilder()
				.setTitle('OC SELECTION (Pairing)')
				.setDescription(`SELECTED: **${character.name}** AND **${character2.name}!**`)
		} else {
			embedMessage = new EmbedBuilder()
				.setTitle('OC Selection (Random)')
				.setDescription(`**SELECTED: ${character.name}!**`)
				.setThumbnail(character.image);
		}
		embedMessage = addStandardFormat(embedMessage);
		await message.reply({ embeds: [embedMessage] });
	},
}
