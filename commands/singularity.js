import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import {
	customCommandExists,
	getMinimumCustomCommandContent,
	getSplitCustomCommandContent,
} from "../utility/custom_commands.js";
import { basicEmbed } from "../utility/format_embed.js";

// Custom command names
const CODENAME_PREFIX = "oddjob_codenames_prefix";
const CODENAME_SUFFIX = "oddjob_codenames_suffix";
const SINGULARITY_LOCALE_NAME = "oddjob_location_ranges";
const SINGULARITY_CLASSIFICATION = "oddjob_classifications";
const SINGULARITY_SIGNATURE = "oddjob_signatures";
const SINGULARITY_RISK = "oddjob_threatrange";
const SINGULARITY_OBSERVATIONS = "oddjob_observations";
const SINGULARITY_CONTACT = "oddjob_notification";

// terms used in replacements
const REPLACE_NAME = "$REPLACE_NAME";
const REPLACE_LOCALE = "$REPLACE_LOCALE";
const REPLACE_CLASSIFICATION = "$REPLACE_CLASSIFICATION";
const REPLACE_OBSERVATIONS = "$REPLACE_OBSERVATIONS";
const REPLACE_RISK = "$REPLACE_RISK";
const REPLACE_SIGNATURE = "$REPLACE_SIGNATURE";


const randomSubcommand =
	new SlashCommandSubcommandBuilder()
		.setName("random")
		.setDescription("Generate a new Singularity");

/*const pregenSubcommand =
	new SlashCommandSubcommandBuilder()
		.setName("pregen")
		.setDescription("Fetch a random Singularity");*/

const data = new SlashCommandBuilder()
	.setName("singularity")
	.setDescription("Singularity generator commands")
	.addSubcommand(randomSubcommand);

function generateSingularityName() {
	const singularityNamePrefix = getSplitCustomCommandContent(CODENAME_PREFIX);
	const singularityNameSuffix = getSplitCustomCommandContent(CODENAME_SUFFIX);

	return `${singularityNamePrefix} ${singularityNameSuffix}`.toUpperCase();
}

function generateSingularityKeywords() {
	const numberOfKeywords = Math.floor((Math.random() * 5) + 1);
	let keywordList = "";

	for (let i = 1; i <= numberOfKeywords; i++) {
		let nextWord = '';
		do {
			nextWord = getSplitCustomCommandContent(SINGULARITY_OBSERVATIONS);
		} while (keywordList.includes(nextWord.toUpperCase()));

		keywordList += `${nextWord.toUpperCase()}`;

		if (i < numberOfKeywords) {
			keywordList += `, `;
		}
	}

	return keywordList;
}

async function generateSingularity(pregen = true) {
	let singularityName;
	let singularityLocale;
	let singularityKeywords;
	let singularitySignature;
	let singularityRisk;
	let singularityClassification;

	if (!pregen) {
		let errorMsg = "";
		const sanityCheckSingularityNames = customCommandExists(CODENAME_PREFIX) && customCommandExists(CODENAME_SUFFIX);
		if (!sanityCheckSingularityNames) errorMsg += "Missing custom command for prefix or suffix; ";

		const sanityCheckSingularityLocale = customCommandExists(SINGULARITY_LOCALE_NAME);
		if (!sanityCheckSingularityLocale) errorMsg += "Missing locale command; ";

		const sanityCheckSingularityClassification = customCommandExists(SINGULARITY_CLASSIFICATION);
		if (!sanityCheckSingularityClassification) errorMsg += "Missing classification command; ";

		const sanityCheckSingularityObservations = customCommandExists(SINGULARITY_OBSERVATIONS);
		if (!sanityCheckSingularityObservations) errorMsg += "Missing observations; ";

		const sanityCheckSingularityRisk = customCommandExists(SINGULARITY_RISK);
		if (!sanityCheckSingularityRisk) errorMsg += "Missing Risk rating; ";

		const sanityCheckSingularityNotification = customCommandExists(SINGULARITY_CONTACT);
		if (!sanityCheckSingularityNotification) errorMsg += "Missing notification text; ";

		if (!!errorMsg) throw new Error(errorMsg);

		singularityName = generateSingularityName();
		singularityLocale = getSplitCustomCommandContent(SINGULARITY_LOCALE_NAME);
		singularityKeywords = generateSingularityKeywords();
		singularitySignature = getSplitCustomCommandContent(SINGULARITY_SIGNATURE);
		singularityRisk = getSplitCustomCommandContent(SINGULARITY_RISK);
		singularityClassification = getSplitCustomCommandContent(SINGULARITY_CLASSIFICATION);

		const singularityMessage = getMinimumCustomCommandContent(SINGULARITY_CONTACT)
			.replace(REPLACE_NAME, singularityName)
			.replace(REPLACE_CLASSIFICATION, singularityClassification)
			.replace(REPLACE_RISK, singularityRisk)
			.replace(REPLACE_SIGNATURE, singularitySignature)
			.replace(REPLACE_OBSERVATIONS, singularityKeywords)
			.replace(REPLACE_LOCALE, singularityLocale)

		const embedMessage = basicEmbed(
			"SINGULARITY DISPATCH",
			singularityMessage,
			''
		);

		return embedMessage;
	}
}

export default {
	data: data,
	/*async execute(interaction) {
		await interaction.deferReply();

	},*/
	async executePrefix(message, args) {
		if (!args) {
			await message.reply('Usage: `!singularity <random|pregen>`');
			return;
		}

		try {
			const pregen = args.trim() === "pregen";
			if (pregen) {
				await message.reply("CLASSIFIED");
			} else {
				await message.reply({ embeds: [await generateSingularity(pregen)] });
			}
			return;
		} catch (error) {
			console.log("Error in !singularity");
			console.log(error);
			return;
		}
	}
}
