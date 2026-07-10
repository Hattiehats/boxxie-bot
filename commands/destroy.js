import {
	SlashCommandBuilder,
	MessageFlags,
} from "discord.js";
import { getTableData } from "../utility/access_data.js";
import { Item, Mun } from "../utility/classes.js";
import { simpleComponent, fuzzyMatchItems } from "../utility/components.js";

const commandBuilder = new SlashCommandBuilder()
	.setName("destroy")
	.setDescription("Destroy items from your inventory.")
	.addStringOption((option) =>
		option
			.setName("item")
			.setDescription("The item to destroy")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("quantity")
			.setMinValue(1)
			.setDescription("How many to destroy (defaults to 1)"),
	);

async function mainFunction(interaction) {
	await interaction.deferReply();

	const itemName = interaction.options.getString("item");
	const quantity = interaction.options.getInteger("quantity") ?? 1;

	if (quantity < 1) {
		await interaction.editReply({
			components: simpleComponent("Quantity must be at least 1! ❌", undefined, false),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	let item;
	try {
		item = new Item(itemName);
	} catch {
		await interaction.editReply({
			components: simpleComponent("Item not found! ❌", undefined, false),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const munID = interaction.user.id;
	const munData = getTableData("muns").find((row) => row.id === munID);
	if (!munData) {
		await interaction.editReply({
			components: simpleComponent("Couldn't find your profile! ❌", undefined, false),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const mun = new Mun(munData.name);
	const inventory = await mun.inventory;

	if (!inventory.checkInventory(itemName)) {
		await interaction.editReply({
			components: simpleComponent(
				"You don't have that item in your inventory! ❌",
				undefined,
				false
			),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const ownedQty = inventory.getItemQuantity(itemName);
	if (ownedQty < quantity) {
		await interaction.editReply({
			components: simpleComponent(
				`You only have ${ownedQty}x **${item.name}**! ❌`,
				undefined,
				false
			),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	try {
		await inventory.addItem(item.name, -quantity);
		await interaction.editReply({
			components: simpleComponent(
				`## 🗑️ Destroyed (${quantity}x) ${item.name}!`,
			),
			flags: MessageFlags.IsComponentsV2,
		});
	} catch (error) {
		console.error(error);
		await interaction.editReply({
			components: simpleComponent("### ERROR", undefined, false),
			flags: MessageFlags.IsComponentsV2,
		});
	}
}

export default {
	data: commandBuilder,
	async execute(interaction) {
		await mainFunction(interaction);
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		try {
			const munID = interaction.user.id;
			const munData = getTableData("muns").find((row) => row.id === munID);
			if (!munData) {
				await interaction.respond([]);
				return;
			}
			const mun = new Mun(munData.name);
			const inv = await mun.inventory;
			const choices = inv.getAllItemNames();
			const filtered = fuzzyMatchItems(choices, focusedValue);
			await interaction.respond(
				filtered.map((c) => ({ name: c, value: c })),
			);
		} catch {
			await interaction.respond([]);
		}
	},
};
