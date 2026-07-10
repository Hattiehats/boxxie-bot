import {
	SlashCommandBuilder,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} from "discord.js";
import { getTableData, getData, updateData, getTimeUntilNextSync, generateMidnightTZ, getTimeUntilTimestamp } from "../utility/access_data.js";
import {
	Mun,
	Character,
	currentStats,
	Generator,
} from "../utility/classes.js";
import { embedColour, parseEmbedColour } from "../utility/format_embed.js"
import { formatTimeRemaining, getFirstOCForMun } from "./daily.js";

const commandBuilder = new SlashCommandBuilder()
	.setName("singularitea")
	.setDescription("Get your free daily beverage from the cafe!")

function checkAvailability(ocName) {
	const stats = new currentStats(ocName);

	if (stats.dailyDrink) {
		const remaining = getTimeUntilTimestamp(stats.dailyDrink);
		if (remaining > 0) {
			return {
				canUse: false,
				reason: `The company pass makes an angry noise. Try again in **${formatTimeRemaining(remaining)}**`
			};
		}
	}
	return { canUse: true, reason: "" };
}

async function mainFunction(userId, reply) {
	const allMuns = getTableData("muns");
	const munData = allMuns.find((row) => row.id === userId);
	let errMsg = undefined;

	let mun, ocName, availability = undefined;
	if (!munData) {
		errMsg = "### No Profile!";
	}

	if (!errMsg) {
		mun = new Mun(munData.name);

		ocName = getFirstOCForMun(munData.name);
		if (!ocName) {
			errMsg = "### No OC!";
		}
	}

	if (!errMsg) {
		availability = checkAvailability(ocName)
		if (!availability.canUse) {
			errMsg = availability.reason;
		}
	}

	if (errMsg) {
		return reply({
			components: [
				new ContainerBuilder()
					.setAccentColor(embedColour(false))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(errMsg),
					),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	}

	let collectionTable = Generator.buildGenerator("SingulariTEA")
	let result = collectionTable.selectOneFromGenerator(true, true, true);

	await updateData("currentStats", "name", ocName, "dailyDrink", String(generateMidnightTZ().valueOf()));


	const container = new ContainerBuilder().setAccentColor(embedColour(true));

	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`## SingulariTEA Special Order for ${ocName}`),
		new TextDisplayBuilder().setContent(`\`\`\`ini\nThe exhausted barista scans your card and right on time hands to you a [${result.name}]\`\`\``),
		new TextDisplayBuilder().setContent(`\`\`\`ini\n${result.description}\`\`\``),
	);

	const replyPayload = {
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	};

	return reply(replyPayload);

}

export default {
	data: commandBuilder,
	async execute(interaction) {
		const userId = interaction.user.id;
		await interaction.deferReply();
		const reply = async (payload) => {
			return interaction.editReply(payload);
		};
		await mainFunction(userId, reply);
	},
}
