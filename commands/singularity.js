import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import {
	customCommandExists,
	getEmbedFromCustomCommand,
	getMinimumCustomCommandContent,
	getSplitCustomCommandContent,
} from "../utility/custom_commands.js";

// Custom command names
const CODENAME_PREFIX = "oddjob_codenames_prefix";
const CODENAME_SUFFIX = "oddjob_codenames_suffix";
const SINGULARITY_LOCALE_NAME = "oddjob_location_ranges";
const SINGULARITY_CLASSIFICATION = "oddjob_classifications";
const SINGULARITY_SIGNATURE = "oddjob_signatures";
const SINGULARITY_RISK = "oddjob_threatrange";
const SINGULARITY_OBSERVATIONS = "oddjob_observations";
const SINGULARITY_CONTACT = "oddjob_notification";
const SINGULARITY_PREGEN_OBSERVATIONS = "oddjob_pregen_text";
const SINGULARITY_EMBEDS_RANDOM = "oddjob_random";
const SINGULARITY_EMBEDS_PREGEN = "oddjob_pregen";

// terms used in replacements
const REPLACE_NAME = "$REPLACE_NAME";
const REPLACE_LOCALE = "$REPLACE_LOCALE";
const REPLACE_CLASSIFICATION = "$REPLACE_CLASSIFICATION";
const REPLACE_OBSERVATIONS = "$REPLACE_OBSERVATIONS";
const REPLACE_TEXT = "$REPLACE_PREGEN";
const REPLACE_RISK = "$REPLACE_RISK";
const REPLACE_SIGNATURE = "$REPLACE_SIGNATURE";

const MAX_RANDOM_KEYWORDS = 4;
const MIN_RANDOM_KEYWORDS = 2;


const data = new SlashCommandBuilder()
	.setName("singularity")
	.setDescription("Singularity generator commands")
	.addStringOption((option) => option.setName("pregentype").setDescription("What kind of singularity?").addChoices([{ name: "Random", value: "random" }, { name: "Pregen", value: "pregen" }]).setRequired(true));

function generateSingularityName() {
	const singularityNamePrefix = getSplitCustomCommandContent(CODENAME_PREFIX);
	const singularityNameSuffix = getSplitCustomCommandContent(CODENAME_SUFFIX);

	return `${singularityNamePrefix} ${singularityNameSuffix}`.toUpperCase();
}

function generateSingularityKeywords() {
	const numberOfKeywords = Math.min(Math.floor((Math.random() * MAX_RANDOM_KEYWORDS) + MIN_RANDOM_KEYWORDS), MAX_RANDOM_KEYWORDS);
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
	let singularityText;

	let errorMsg = "";
	const sanityCheckSingularityNames = customCommandExists(CODENAME_PREFIX) && customCommandExists(CODENAME_SUFFIX);
	if (!sanityCheckSingularityNames && !pregen) errorMsg += "Missing custom command for prefix or suffix; ";

	const sanityCheckSingularityLocale = customCommandExists(SINGULARITY_LOCALE_NAME);
	if (!sanityCheckSingularityLocale && !pregen) errorMsg += "Missing locale command; ";

	const sanityCheckSingularityClassification = customCommandExists(SINGULARITY_CLASSIFICATION);
	if (!sanityCheckSingularityClassification && !pregen) errorMsg += "Missing classification command; ";

	const sanityCheckSingularityObservations = customCommandExists(SINGULARITY_OBSERVATIONS);
	if (!sanityCheckSingularityObservations && !pregen) errorMsg += "Missing observations; ";

	const sanityCheckSingularityRisk = customCommandExists(SINGULARITY_RISK);
	if (!sanityCheckSingularityRisk && !pregen) errorMsg += "Missing Risk rating; ";

	const sanityCheckSingularityNotification = customCommandExists(SINGULARITY_CONTACT);
	if (!sanityCheckSingularityNotification && !pregen) errorMsg += "Missing notification text; ";

	const sanityCheckSingularityRadioText = customCommandExists(SINGULARITY_EMBEDS_RANDOM);
	if (!sanityCheckSingularityRadioText && !pregen) errorMsg += "Missing relevant embed; ";

	const sanityCheckSingularityPregenMessageText = customCommandExists(SINGULARITY_EMBEDS_PREGEN);
	if (!sanityCheckSingularityPregenMessageText && pregen) errorMsg += "Missing pregen embed; ";

	if (!!errorMsg) throw new Error(errorMsg);

	singularityName = generateSingularityName();
	singularityLocale = getSplitCustomCommandContent(SINGULARITY_LOCALE_NAME).toUpperCase();
	singularityKeywords = generateSingularityKeywords();
	singularitySignature = getSplitCustomCommandContent(SINGULARITY_SIGNATURE);
	singularityRisk = getSplitCustomCommandContent(SINGULARITY_RISK).toUpperCase();
	singularityClassification = getSplitCustomCommandContent(SINGULARITY_CLASSIFICATION).toUpperCase();
	singularityText = getMinimumCustomCommandContent(SINGULARITY_PREGEN_OBSERVATIONS);

	const embeds = getEmbedFromCustomCommand((pregen ? SINGULARITY_EMBEDS_PREGEN : SINGULARITY_EMBEDS_RANDOM), (entry) => {
		return entry
			.replace(REPLACE_NAME, singularityName)
			.replace(REPLACE_CLASSIFICATION, singularityClassification)
			.replace(REPLACE_RISK, singularityRisk)
			.replace(REPLACE_SIGNATURE, singularitySignature)
			.replace(REPLACE_OBSERVATIONS, singularityKeywords)
			.replace(REPLACE_LOCALE, singularityLocale)
			.replace(REPLACE_TEXT, singularityText)
	});

	return embeds;
}

export default {
	data: data,
	async execute(interaction) {
		try {
			const selectedOption = interaction.options.getString("pregentype");
			await interaction.reply({ embeds: await generateSingularity(selectedOption === "pregen") });
		} catch (error) {
			console.log("Error in singularity command");
			console.log(error);
			return;
		}
	},
	async executePrefix(message, args) {
		if (!args) {
			await message.reply('Usage: `!singularity <random|pregen>`');
			return;
		}

		try {
			const pregen = args.trim() === "pregen";
			await message.reply({ embeds: await generateSingularity(pregen) });
		} catch (error) {
			console.log("Error in !singularity");
			console.log(error);
			return;
		}
	}
}
