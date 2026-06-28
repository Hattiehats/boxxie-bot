import { EmbedBuilder } from "discord.js";
import { addStandardFormat } from "./format_embed.js";
import { pickOne } from "./utils.js";

function getSeason(month) {
	if (month == 11 || month <= 1) return 'winter';
	if (month > 1 && month <= 4) return 'spring';
	if (month > 4 && month <= 7) return 'summer';
	else return 'autumn';
}

function generateWeatherText(season) {
	const commonWeather = [
		{ header: "DRIZZLE", text: "The sky proves only to tease, with a smattering of rain to ruin the perfectly good day." },
		{ header: "SUNNY", text: "The sun shines down on the streets of New York." },
		{ header: "CLOUDY", text: "The sun shies away today!" },
		{ header: "UNEXPECTED DOWNPOUR", text: "I hope you brought your umbrella, and left extra time in your commute!" }
	];
	let answer;
	switch (season) {
		case "winter":
			answer = [
				...commonWeather
			];
			break;
		case "spring":
			answer = [
				...commonWeather
			];
			break;
		case "autumn":
			answer = [
				...commonWeather
			];
			break;
		case "summer":
			answer = [
				...commonWeather
			];
			break;
		default:
			answer = commonWeather;
	}

	return pickOne(answer);
}

function generateDailyWeatherComponent() {
	const date = new Date();
	const season = getSeason(date.getMonth());

	const weatherStruct = generateWeatherText(season);

	return {
		name: "## Weather Report",
		value: `### ${weatherStruct.HEADER} \n _${weatherStruct.text}_`
	};
}

function generateEmployeeComponent() {

	// TODO EMPLOYEE CALLOUTS 

}

function generateRandomEventComponent() {

	// TODO RANDOM EVENTS
}

export function generateDaily() {
	const embed = new EmbedBuilder()
		.setTitle("Good Morning, Proxies!")
		.setDescription("_It's a beautiful day to work at Linn Co!_")
		.addFields(generateDailyWeatherComponent())



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

	return addStandardFormat(embed);
}
