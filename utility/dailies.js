import { EmbedBuilder } from "discord.js";
import { addStandardFormat } from "./format_embed.js";
import { pickOne } from "./utils.js";
import { Generator } from "./classes.js";
import { getRandomOC } from "../commands/daily.js";

export function getSeason(month) {
	if (month == 11 || month <= 1) return 'WINTER';
	if (month > 1 && month <= 4) return 'SPRING';
	if (month > 4 && month <= 7) return 'SUMMER';
	else return 'AUTUMN';
}

function generateWeatherText() {
	const collectionTable = Generator.buildGenerator("Weather");
	let result = collectionTable.selectOneFromGenerator(true, true, true);

	const errorWeather = {
		name: "Void Nightmare",
		entropic: true,
		description: "Uh. Don't look up. Maybe check on the Intern."
	};

	if (!result || !result.name) {
		result = errorWeather;
	}
	return result;
}

function generateEmployment(disciplinary) {
	const errorMessage = {
		name: "UNKNOWABLE INCIDENT",
		description: "[REDACTED]",
		entropic: true,
	};

	const collection = Generator.buildGenerator(disciplinary ? "Disciplinary" : "EOTD")
	let result = collection.selectOneFromGenerator(true, true, true);

	if (!result || !result.name) {
		result = errorWeather;
	}
	return result;

}

const divider = {
	name: "━━━━━━━━━━━━━━",
	value: ""
}


export function generateDaily() {
	const header = "# :IRIS: GOOD MORNING, PROXIES!";
	const subheader = "-# ⸻ It's another lovely Linne Co. day.";

	const weather = generateWeatherText();

	const eotdChar = getRandomOC()
	const daChar = getRandomOC(eotdChar.name)

	const eotd = generateEmployment(false)
	const disciplinary = generateEmployment(true)

	let message = `${header}
${subheader}
:white_sun_small_cloud: **${weather.entropic ? "ENTROPIC WEATHER EVENT" : "TODAY'S WEATHER"}**: ${weather.name} 
> *${weather.description}*

:chart_with_upwards_trend: **EMPLOYEE OF THE DAY**: ${eotdChar.name}, for ${eotd.name}.
> *${eotd.description}*

:chart_with_downwards_trend: **DISCIPLINARY ACTION**: ${daChar.name}, for ${disciplinary.name}.
> *${disciplinary.description}*
`;

	/*
	if (Math.random() <= 0.4) {
		// Select an employee
		// .addFields(generateEmployeeComponent())
		console.log("This should generate an employee callout");
	}

	if (Math.random() <= 0.15) {
		// Random event
		// .addFields(generateRandomEventComponent()
		console.log("This should generate a random event");
	}
	*/

	//return addStandardFormat(embed);
	return message
}
