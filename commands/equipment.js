import { SlashCommandBuilder, CommandInteraction, MessageFlags } from 'discord.js';
import { Mun, Character, Item, Inventory } from '../utility/classes.js';
import { basicEmbed, parseEmbedColour } from '../utility/format_embed.js';
import { getData, getTableData } from '../utility/access_data.js';
import { fuzzyMatchItems, simpleComponent } from '../utility/components.js';

const commandBuilder = new SlashCommandBuilder()
	.setName('equip')
	.setDescription("Equip an item to your character")
	.addStringOption((option) =>
		option
			.setName("Item")
			.setDescription("The item in question, or leave blank to unequip")
			.setRequired(false)
			.setAutocomplete(true)
	)
	.addStringOption((option) =>
		option
			.setName("Character")
			.setDescription("Character to equip it to, defaults to your primary")
			.setRequired(false)
			.setAutocomplete(true)
	)

async function mainFunction(interaction) {
	await interaction.deferReply();

	const munID = interaction.user.id;
	const munName = getData("muns", "id", munID).name;
	const mun = new Mun(munName);
	const inventory = await mun.inventory;

	let ocName = interaction.options.getString("Character");
	if (!ocName) {
		ocName = mun.ocs.split(",")[0]
	}

	if (!ocName) {
		await interaction.editReply({
			components: simpleComponent("No character or character not found"),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	const char = new Character(ocName);

	const itemName = interaction.options.getString("Item");

	if (!itemName) {
		// unequip
		try {
			await char.currentStats.unequipItem();
			await interaction.editReply({
				components: simpleComponent(`Cleared equipment from ${char.name}!`),
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logging.error(`error removing item from ${char.name}`);
			logging.error(error);
			await interaction.editReply({
				components: simpleComponent(`Unable to remove ${char.name}'s Equipment`),
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}
	}

	const thisItem = inventory.getItem(itemName);

	if (thisItem === "Not in inventory!") {
		await interaction.editReply({
			components: simpleComponent("That item is not in your inventory! ❌"),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	if (!thisItem.type != 'Equipment') {
		await interaction.editReply({
			components: simpleComponent("This item can't be equipped! ❌"),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}

	try {
		const thumbnail = getData("shop", "name", itemName).image;
		await char.currentStats.equipItem(itemName);

		const msg = `### ${char.name} equipped ${itemName}!\n${thisItem.description}`;
		await interaction.editReply({
			components: simpleComponent(msg, thumbnail)
		});
		return;


	} catch (error) {
		logging.error(`Error in equipping item ${itemName} to ${char.name}`);
		logging.error(error);
		await interaction.editReply({
			components: simpleComponent(`Error in equipping ${itemName} to ${char.name}`),
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	}
}

export default {
	data: commandBuilder,
	async autocomplete(interaction) {
		const focusedValue = interaction.option.getFocused(true);
		const mun = new Mun(getTableData("muns").find((row) => row.id === interaction.user.id));
		switch (focusedValue.name) {
			case "Item":
				const inventory = await mun.inventory;
				const choices = inventory.getAllItemNames()
					.filter((name) => {
						const item = inventory.getItem(name);
						return item && item !== "Not in inventory!" && item.type === 'Equipment';
					});
				const filtered = fuzzyMatchItems(choices, focusedValue.value);
				await interaction.respond(
					filtered.map((choice) => ({ name: choice, value: choice })),
				);
				break;
			case "Character":
				await interaction.respond(mun.ocs.split(",").map((oc) => ({ name: oc, value: oc })));
		}
		await interaction.respond(
			filtered.map((name) => ({ name: name, value: name })),
		);
	},
	async execute(interaction) {
		await mainFunction(interaction);
	},
}
