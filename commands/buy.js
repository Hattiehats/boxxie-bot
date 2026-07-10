import {
	SlashCommandBuilder,
	MessageFlags,
} from "discord.js";
import { getTableData } from "../utility/access_data.js";
import {
	TextDisplayBuilder,
	ContainerBuilder,
} from "discord.js";
import {
	getAllItemNames,
	Item,
	Mun,
} from "../utility/classes.js";
import { fuzzyMatchItems } from "../utility/components.js";
import { embedColour } from "../utility/format_embed.js";

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
			.setMinValue(1)
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

function getScripErrorComponent(mun, amount, currency, currencyName) {
	return [
		new ContainerBuilder().setAccentColor(embedColour(false)).addTextDisplayComponents(
			new TextDisplayBuilder()
				.setContent(`**\`\`\`ERROR: Not enough ${currencyName} in ${mun.name}'s wallet to pay ${amount}!\`\`\`**
                                \uD83D\uDCB0 **BALANCE:** \`${mun[currency]}\` ${currencyName}`),
		),
	];
}

function getPurchasedComponent(itemName, quantity, newBalance, currency) {
	const message = `## Purchased ${quantity} ${itemName}`;
	return [
		new ContainerBuilder()
			.setAccentColor(embedColour(true))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# \uD83D\uDCB0 NEW BALANCE: ${newBalance} ${currency}`)),
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
		const newBalance = mun[item.currency];
		await interaction.editReply({
			components: getPurchasedComponent(itemName, quantity, newBalance, item.currencyName),
			flags: MessageFlags.IsComponentsV2,
		});
	} catch (error) {
		if (error.message.includes("Not enough ")) {
			await interaction.editReply({
				components: getScripErrorComponent(mun, quantity, item.currency, item.currencyName),
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
