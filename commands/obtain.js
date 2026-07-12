import { SlashCommandBuilder, MessageFlags } from "discord.js";
import {
	TextDisplayBuilder,
	ContainerBuilder,
	SectionBuilder,
	ThumbnailBuilder,
} from "discord.js";
import { getTableData, addInventoryRow } from "../utility/access_data.js";
import { getAllItemNames, Item, Mun } from "../utility/classes.js";
import { fuzzyMatchItems } from "../utility/components.js";
import { basicEmbed, embedColour } from "../utility/format_embed.js";

const commandBuilder = new SlashCommandBuilder()
	.setName("obtain")
	.setDescription("Give an item to a user (bypasses price and availability)")
	.addStringOption((option) =>
		option
			.setName("item")
			.setDescription("The item to give")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user to give the item to. Defaults to you."),
	)
	.addIntegerOption((option) =>
		option
			.setName("quantity")
			.setDescription("How many to give. Defaults to 1."),
	);

async function mainFunction(interaction) {
	const targetUser = interaction.options.getUser("user") ?? interaction.user;
	const itemName = interaction.options.getString("item");
	const quantity = interaction.options.getInteger("quantity") ?? 1;

	const allMuns = getTableData("muns");
	const munData = allMuns.find((row) => row.id === targetUser.id);

	if (!munData) {
		await interaction.reply({
			content: `Could not find a registered mun for <@${targetUser.id}>.`,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const item = new Item(itemName);
	const currentDate = new Date();
	const newRowData = {
		id: munData.id,
		mun: munData.name,
		item: item.name,
		amount: quantity,
		date: currentDate.toUTCString(),
	};
	await addInventoryRow(newRowData);

	const message = `## Obtained (${quantity}x) ${item.name}! 📦\nGiven to **${munData.name}**.`;

	const container = new ContainerBuilder().setAccentColor(embedColour(true));
	if (item.image) {
		container.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(new ThumbnailBuilder().setURL(item.image))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(message),
				),
		);
	} else {
		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(message),
		);
	}
	const components = [container];

	await interaction.reply({
		components: components,
		flags: MessageFlags.IsComponentsV2,
	});
}

export default {
	data: commandBuilder,
	async execute(interaction) {
		await mainFunction(interaction);
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		// Show ALL items regardless of shop or availability
		const allItems = getTableData("shop").map((row) => row.name);
		const filtered = fuzzyMatchItems(allItems, focusedValue);
		await interaction.respond(
			filtered.map((name) => ({ name: name, value: name })),
		);
	},
};
