import { EmbedBuilder } from 'discord.js';
import { pickOne } from './utils.js';

export function parseEmbedColour(colour) {
	const colourString = colour ?? process.env.EMBED_COLOUR;
	return colourString ? parseInt(colourString, 16) : 0x00ff00;
}

export function embedColour(success) {
	return parseEmbedColour(success ? process.env.EMBED_SUCCESS_COLOUR : process.env.EMBED_FAIL_COLOUR);
}

export const EMPTY = '\u200b';
const iconList = [
	'https://img.icons8.com/?size=96&id=63804&format=png',
	'https://img.icons8.com/?size=80&id=21392&format=png',
	'https://img.icons8.com/?size=48&id=21079&format=png',
]
// "https://img.icons8.com/?size=100&id=lTImOaDFYG9P&format=png&color=000000"
export function addStandardFormat(embedBuilder) {
	embedBuilder
		.setAuthor({
			name: "Linne Co. Administration",
			iconURL: "https://images2.imgbox.com/f6/3e/JyiFMyzL_o.png",
		})
		.setColor(parseEmbedColour())
		.setFooter({
			text: pickOne(potentialFooterTexts),
			iconURL: pickOne(iconList),
		});

	return embedBuilder;
}

export const potentialFooterTexts = [
	"Non haberi sed esse",
	"For the future, together.",
	"Friendly reminder to wear your IRIS at all times.",
	"Have you signed up for the company softball team?",
	"DISREGARD ABOVE DOCUMENT.",
	"Document classification A-I(S).",
	"The contents above are to be considered Confidential.",
]

export function basicEmbed(title = EMPTY, description = EMPTY, thumbnail = EMPTY, image = EMPTY, link = EMPTY, format = true) {
	let embedMessage = new EmbedBuilder();

	if (title != EMPTY) {
		embedMessage.setTitle(title);
	}
	if (description != EMPTY) {
		embedMessage.setDescription(description);
	}
	if (thumbnail != EMPTY) {
		embedMessage.setThumbnail(thumbnail);
	}
	if (image != EMPTY) {
		embedMessage.setImage(image);
	}
	if (link != EMPTY) {
		embedMessage.setURL(link);
	}

	if (format) { embedMessage = addStandardFormat(embedMessage) };

	return embedMessage;
}
