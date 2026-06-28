import { EmbedBuilder } from 'discord.js';
import { pickOne } from './utils.js';

export function addStandardFormat(embedBuilder) {
	embedBuilder
		.setAuthor({
			name: "Linne Co. Administration",
			iconURL: "https://images2.imgbox.com/4e/ec/hLgncloX_o.png",
		})
		.setColor(process.env.EMBED_COLOUR)
		.setFooter({
			text: pickOne(potentialFooterTexts),
			iconURL: "https://img.icons8.com/?size=100&id=lTImOaDFYG9P&format=png&color=000000",
		});

	return embedBuilder;
}

const potentialFooterTexts = [
	"Linne Co. - For the future, together.",
	"Friendly reminder to wear your IRIS at all times.",
	"Have you signed up for the company softball team?",
	"Document classification A-I(S).",
	"The contents above are to be considered Confidential.",
]

export function basicEmbed(title = "", description = "", thumbnail = "", image = "", link = "", format = true) {
	let embedMessage = new EmbedBuilder();

	if (title != "") {
		embedMessage.setTitle(title);
	}
	if (description != "") {
		embedMessage.setDescription(description);
	}
	if (thumbnail != "") {
		embedMessage.setThumbnail(thumbnail);
	}
	if (image != "") {
		embedMessage.setImage(image);
	}
	if (link != "") {
		embedMessage.setURL(link);
	}

	if (format) { embedMessage = addStandardFormat(embedMessage) };

	return embedMessage;
}
