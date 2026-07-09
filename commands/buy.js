import {
	SlashCommandBuilder,
	MessageFlags,
} from "discord.js";
import { getTableData } from "../utility/access_data.js";
import {
	TextDisplayBuilder,
	ContainerBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	SectionBuilder,
	ThumbnailBuilder,
} from "discord.js";
import {
	getAllItemNames,
	Item,
	Mun,
} from "../utility/classes.js";
import { getBuyConfirmContainer, fuzzyMatchItems } from "../utility/components.js";
import { basicEmbed, embedColour, parseEmbedColour } from "../utility/format_embed.js";

const commandBuilder = new SlashCommandBuilder()
	.setName("buy")
	.setDescription("Buy an item!")
	.addStringOption((option) =>
		option
			.setName("item")
			.setDescription("Which item do you want to buy?")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("quantity")
			.setDescription("How many do you want to buy? Defaults to 1."),
	);

const errorComponent = [
	new ContainerBuilder()
		.setAccentColor(embedColour(false))
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("### Sorry! I ran into an error :("),
		),
];

const cancelComponent = [
	new ContainerBuilder()
		.setAccentColor(embedColour(false))
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("## Purchase Canceled! \uD83D\uDEAB"),
		),
];

function getNotPurchasableComponent(itemName) {
	return [
		new ContainerBuilder().setAccentColor(embedColour(false)).addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`**\`\`\`ERROR: ${itemName} is not available for purchase!\`\`\`**`,
			),
		),
	];
}

function getScripErrorComponent(mun, amount) {
	return [
		new ContainerBuilder().setAccentColor(embedColour(false)).addTextDisplayComponents(
			new TextDisplayBuilder()
				.setContent(`**\`\`\`ERROR: Not enough capital in ${mun.name}'s wallet to pay ${amount}!\`\`\`**
                                \uD83D\uDCB0 **BALANCE:** \`${mun.capital}\` capital`),
		),
	];
}

function getPurchasedComponent(itemName, quantity, newBalance) {
	const message =
		"## Purchased ([QUANTITY]x) [ITEM_NAME]! \uD83C\uDF89"
			.replace("[QUANTITY]", quantity)
			.replace("[ITEM_NAME]", itemName);
	return [
		new ContainerBuilder()
			.setAccentColor(embedColour(true))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# \uD83D\uDCB0 NEW BALANCE: ${newBalance}`)),
	];
}

async function mainFunction(interaction) {
	await interaction.deferReply();

	const itemName = interaction.options.getString("item");
	const quantity = interaction.options.getInteger("quantity") ?? 1;

	const item = new Item(itemName);

	// Block items with 0 or empty buy price
	if (!item.buyPrice || isNaN(item.buyPrice) || item.buyPrice <= 0) {
		await interaction.editReply({
			components: getNotPurchasableComponent(item.name),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const munID = interaction.user.id;
	const allMuns = getTableData("muns");
	const munName = allMuns.find((row) => row.id === munID).name;
	const mun = new Mun(munName);

	try {
		await (await mun.inventory).buyItem(itemName, quantity);
		const newBalance = mun.capital;
		await interaction.editReply({
			components: getPurchasedComponent(itemName, quantity, newBalance),
			flags: MessageFlags.IsComponentsV2,
		});
	} catch (error) {
		if (error.message === "Not enough capital!") {
			await interaction.editReply({
				components: getScripErrorComponent(mun, quantity),
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			await interaction.editReply({
				components: errorComponent,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}
}

export default {
	data: commandBuilder,
	async execute(interaction) {
		await mainFunction(interaction);
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const choices = getAllItemNames(null);
		const filtered = fuzzyMatchItems(choices, focusedValue);
		await interaction.respond(
			filtered.map((choice) => ({ name: choice, value: choice })),
		);
	},
};
