import {
	SlashCommandBuilder,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} from "discord.js";
import { getTableData, getData, updateData, generateMidnightTZ, getTimeUntilTimestamp } from "../utility/access_data.js";
import {
	Mun,
	Character,
	currentStats,
	getGachaItems,
} from "../utility/classes.js";
import { embedColour } from "../utility/format_embed.js"
import {
	getCustomCommandContent,
	customCommandExists,
} from "../utility/custom_commands.js";

// Daily types that involve another character (PvP-flavored)
const PVP_DAILIES = new Set(["scheme", "teamup"]);

const commandBuilder = new SlashCommandBuilder()
	.setName("daily")
	.setDescription("Do your daily task for money!")
	.addStringOption((option) =>
		option
			.setName("type")
			.setDescription("What kind of daily do you want to do?")
			.setRequired(true)
			.addChoices(
				{ name: "Work — Safe 5 capital", value: "work" },
				{ name: "Grind — 2-10 capital", value: "grind" },
				{ name: "Appease — Coin flip", value: "appease" },
				{ name: "Scheme — -5 to +15 capital (flavor from another OC)", value: "scheme" },
				{ name: "Team Up — You get -3 to +5 capital, another OC gets +10 to +15", value: "teamup" },
			),
	);

/**
 * Picks a random OC from the full roster, returns a Character object.
 * Excludes OCs belonging to the given mun so you can't target yourself.
 */
function getRandomOC(excludeMun) {
	const allOCs = getTableData("ocs");
	if (!allOCs || allOCs.length === 0) return null;
	let candidates = allOCs.filter((o) => o.name !== "Test Character");
	if (excludeMun) candidates = candidates.filter((o) => o.mun !== excludeMun);
	if (candidates.length === 0) return null;
	const idx = Math.floor(Math.random() * candidates.length);
	return new Character(candidates[idx].name);
}

/**
 * Looks up the Discord user ID for a character's mun (player).
 */
function getMunIdForCharacter(character) {
	if (!character || !character.mun) return null;
	const munData = getData("muns", "name", character.mun);
	return munData ? munData.id : null;
}

/**
 * Formats a time-remaining string from milliseconds.
 */
export function formatTimeRemaining(ms) {
	if (ms <= 0) return "now";
	const hours = Math.floor(ms / (1000 * 60 * 60));
	const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((ms % (1000 * 60)) / 1000);
	const parts = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
	return parts.join(" ");
}

/**
 * Checks whether the user can use daily (not on cooldown, no consequence block).
 * Daily resets globally when the 24-hour periodic sync runs (clears all daily fields).
 * Returns { canUse: true } or { canUse: false, reason: string }
 */
function checkDailyAvailability(ocName) {
	const stats = new currentStats(ocName);

	// Check consequence (overtime exhaustion blocks daily)
	if (stats.dailyConsequence) {
		const remaining = getTimeUntilTimestamp(stats.dailyConsequence);
		if (remaining > 0) {
			return {
				canUse: false,
				reason: `You're exhausted and in no condition to work a proper day. Try again in **${formatTimeRemaining(remaining)}** and get some rest!`,
			};
		}
	}

	// Check if the time for the next daily has passed
	if (stats.daily) {
		const remaining = getTimeUntilTimestamp(stats.daily);
		if (remaining > 0) {
			return {
				canUse: false,
				reason: `You've already done your daily! Next reset in **${formatTimeRemaining(remaining)}**.`
			};
		}
	}

	return { canUse: true };
}

// ─── Daily reward calculators ───

function rollWork() {
	return { amount: 5, description: "Another day, another **5** capital." };
}

function rollHustle() {
	// 2 to 10, EV = 6
	const amount = Math.floor(Math.random() * 9) + 2;
	return { amount, description: `You got **${amount}** capital for the extra work.` };
}

function rollSteal() {
	// -10 to +25, EV = 7.5
	const amount = Math.floor(Math.random() * 36) - 10;
	return {
		amount, description: amount >= 0
			? `You got away with **${amount}** capital!`
			: `You got caught! You were fined **${Math.abs(amount)}** capital.`
	};
}

function rollScavenge() {
	// 80% → 1-3, 10% → 30, 10% → item from Trash gacha
	const roll = Math.random();
	if (roll < 0.8) {
		const amount = Math.floor(Math.random() * 3) + 1;
		return { amount, item: null, description: `You dug through the trash and found **${amount}** capital.` };
	} else if (roll < 0.9) {
		return { amount: 30, item: null, description: "You found someone's lost wallet! **30** capital!" };
	} else {
		// Item from Trash gacha pool
		const trashItems = getGachaItems("Trash");
		if (trashItems.length === 0) {
			return { amount: 1, item: null, description: "You dug through the trash but found nothing useful. **1** capital for your trouble." };
		}
		// Use weighted pool like gacha
		const pool = [];
		for (const item of trashItems) {
			const rarity = parseInt(item.rarity) || 1;
			for (let i = 0; i < rarity; i++) pool.push(item);
		}
		const pulled = pool[Math.floor(Math.random() * pool.length)];
		return { amount: 0, item: pulled.name, description: `You found something in the trash: **${pulled.name}**!` };
	}
}

function rollSuckup() {
	// 50% → 0, 50% → 12. EV = 6
	const success = Math.random() < 0.5;
	return success
		? { amount: 12, description: "It paid off. **12** Capital for the effort." }
		: { amount: 0, description: "No dice, sadly. **0** Capital, despite your extra effort." };
}

function rollSabotage() {
	// -5 to +15, EV = 5
	const amount = Math.floor(Math.random() * 21) - 5;
	return {
		amount, description: amount >= 0
			? `You were paid **${amount}** capital for your scheme. Tell no one of your windfall.`
			: `You ended up **${Math.abs(amount)}** capital out of pocket.`
	};
}

function rollOvertime() {
	// 8 capital, 20% chance of exhaustion (can't do daily tomorrow)
	const exhausted = Math.random() < 0.2;
	return {
		amount: 8,
		exhausted,
		description: exhausted
			? "You made **8** capital, but you're gonna be feeling it in the morning. Tomorrow is not looking too good."
			: "You put in the extra mile and earned **8** capital. Not bad!",
	};
}

function rollCooperate() {
	// 20% jackpot: both get +15
	const jackpot = Math.random() < 0.2;
	if (jackpot) {
		return {
			amount: 15,
			partnerAmount: 15,
			jackpot: true,
			description: "You both get **15** capital. Splendid teamwork!",
		};
	}
	// Normal: player gets -3 to +5, partner gets 10-15
	const amount = Math.floor(Math.random() * 9) - 3;
	const partnerAmount = Math.floor(Math.random() * 6) + 10;
	return {
		amount,
		partnerAmount,
		jackpot: false,
		description: amount >= 0
			? `The teamwork pays off, and you take **${amount}** capital for yourself.`
			: `You may have had to invest **${Math.abs(amount)}** capital into the effort, but it paid off for one of you. Just not, y'know, _you_ you.`,
	};
}

/**
 * Tries to get flavor content from the custom command system.
 * Looks for a command named "daily_{type}" (e.g. "daily_work").
 * Returns the full result object from getCustomCommandContent
 * (which also processes Item, Money, Limited, Priority internally).
 */
async function getDailyFlavor(dailyType, userId) {
	const commandName = `daily_${dailyType}`;
	if (!customCommandExists(commandName)) return null;
	const result = await getCustomCommandContent(commandName, userId);
	return result || null;
}

/**
 * Gets the first OC belonging to a mun (player).
 */
export function getFirstOCForMun(munName) {
	const allOCs = getTableData("ocs");
	if (!allOCs) return null;
	const oc = allOCs.find((o) => o.mun === munName);
	return oc ? oc.name : null;
}

const VALID_TYPES = new Set(["work", "grind", "appease", "scheme", "teamup"]);

async function mainFunction(dailyType, userId, reply) {
	// Find the player's mun
	const allMuns = getTableData("muns");
	const munData = allMuns.find((row) => row.id === userId);
	if (!munData) {
		return reply({
			components: [
				new ContainerBuilder()
					.setAccentColor(embedColour(false))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("### Could not find your profile!"),
					),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	}

	const mun = new Mun(munData.name);

	// Find the player's first OC to track daily state
	const ocName = getFirstOCForMun(munData.name);
	if (!ocName) {
		return reply({
			components: [
				new ContainerBuilder()
					.setAccentColor(embedColour(false))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("### You need at least one OC to use daily!"),
					),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	}

	// Check daily availability
	const availability = checkDailyAvailability(ocName);
	if (!availability.canUse) {
		return (reply)({
			components: [
				new ContainerBuilder()
					.setAccentColor(embedColour(false))
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`### ⏰ Daily Unavailable\n${availability.reason}`),
					),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	}

	// Roll the daily
	let result;
	let targetOC = null;
	let targetMunId = null;

	switch (dailyType) {
		case "work":
			result = rollWork();
			break;
		case "grind":
			result = rollHustle();
			break;
		case "appease":
			result = rollSuckup();
			break;
		case "scheme":
			result = rollSabotage();
			targetOC = getRandomOC(munData.name);
			targetMunId = targetOC ? getMunIdForCharacter(targetOC) : null;
			break;
		case "teamup":
			result = rollCooperate();
			targetOC = getRandomOC(munData.name);
			targetMunId = targetOC ? getMunIdForCharacter(targetOC) : null;
			break;
		default:
			result = rollWork();
	}

	// Give partner their capital (cooperate)
	if (result.partnerAmount && targetOC) {
		const targetMunData = targetOC.mun ? getData("muns", "name", targetOC.mun) : null;
		if (targetMunData) {
			try {
				const partnerMun = new Mun(targetMunData.name);
				await partnerMun.addScrip(result.partnerAmount);
			} catch (e) {
				console.error("Daily cooperate: Failed to give partner capital:", e);
			}
		}
	}

	// Apply money reward
	const amount = result.amount || 0;
	if (amount !== 0) {
		if (amount > 0) {
			await mun.addScrip(amount);
		} else {
			// Negative amount — try to remove, but don't go below 0
			const toRemove = Math.min(Math.abs(amount), mun.scrip);
			if (toRemove > 0) {
				await mun.removeScrip(toRemove);
			}
		}
	}

	// Apply item reward (scavenge)
	if (result.item) {
		try {
			const inventory = await mun.inventory;
			await inventory.addItem(result.item, 1);
		} catch (e) {
			console.error("Daily: Failed to give item:", e);
		}
	}

	// Mark daily as used (store timestamp)
	await updateData("currentStats", "name", ocName, "daily", String(generateMidnightTZ().valueOf()));

	// Apply consequence (overtime exhaustion)
	if (result.exhausted) {
		await updateData("currentStats", "name", ocName, "dailyConsequence", String(generateMidnightTZ(2).valueOf()));
	}

	// Build the response
	const container = new ContainerBuilder().setAccentColor(embedColour(true));

	// Title
	const typeLabel = dailyType.charAt(0).toUpperCase() + dailyType.slice(1);
	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`## 📋 Daily: ${typeLabel}`),
	);

	// Flavor content from custom command (if available)
	// getCustomCommandContent already handles Priority, Limited, Item, Money internally
	let flavor = null;
	try {
		flavor = await getDailyFlavor(dailyType, userId);
	} catch (e) {
		// Flavor is optional
	}

	// Extract flavor text from the result
	let flavorText = null;
	let flavorEmbeds = null;
	let flavorFiles = null;
	if (flavor) {
		if (typeof flavor === "string") {
			flavorText = flavor;
		} else if (flavor.content) {
			flavorText = flavor.content;
		}
		if (flavor.embeds) flavorEmbeds = flavor.embeds;
		if (flavor.files) flavorFiles = flavor.files;
	}

	// For PvP dailies, add target info
	let pvpText = "";
	if (PVP_DAILIES.has(dailyType) && targetOC) {
		console.log(`DAILY: ${dailyType} IS PVP TYPE, TARGET: ${targetOC}`);
		const targetTag = targetMunId ? ` (<@${targetMunId}>)` : "";
		if (dailyType === "scheme") {
			pvpText = `You messed with **${targetOC.name}**'s workspace${targetTag}!\n`;
		} else if (dailyType === "teamup") {
			pvpText = result.jackpot
				? `You and **${targetOC.name}**${targetTag} hit a perfect synergy!\n`
				: `You got roped into helping **${targetOC.name}**${targetTag}.\n`;
		}
	}

	// Replace [OC] placeholder in flavor text with the target character name
	if (flavorText && targetOC) {
		flavorText = flavorText.replaceAll("[OC]", targetOC.name);
	}

	// Combine flavor text + PvP text + result
	let bodyText = "";
	if (flavorText) bodyText += `*${flavorText}*\n\n`;
	if (pvpText) bodyText += pvpText;
	bodyText += result.description;

	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(bodyText),
	);

	container.addSeparatorComponents(
		new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
	);

	// Footer — small text balance summary (matches buy/sell pattern)
	const updatedMun = new Mun(munData.name);
	let footerParts = [`-# 💰 NEW BALANCE: ${updatedMun.capital}`];
	if (amount > 0) {
		footerParts[0] += ` (+${amount})`;
	} else if (amount < 0) {
		footerParts[0] += ` (${amount})`;
	}
	if (result.item) {
		footerParts.push(`-# 📦 Received: ${result.item}`);
	}
	if (result.exhausted) {
		footerParts.push(`-# 😴 Too exhausted to work tomorrow.`);
	}
	if (result.partnerAmount && targetOC) {
		footerParts.push(`-# 🤝 ${targetOC.name} received ${result.partnerAmount} capital`);
	}

	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(footerParts.join("\n")),
	);

	const replyPayload = {
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	};

	// Attach flavor embeds and images from custom command
	if (flavorEmbeds) replyPayload.embeds = flavorEmbeds;
	if (flavorFiles) replyPayload.files = flavorFiles;

	return reply(replyPayload);
}

export default {
	data: commandBuilder,
	async execute(interaction) {
		const dailyType = interaction.options.getString("type");
		const userId = interaction.user.id;
		await interaction.deferReply();
		const reply = async (payload) => {
			return interaction.editReply(payload);
		};
		await mainFunction(dailyType, userId, reply);
	},
};
