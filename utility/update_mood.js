import { ActivityType } from "discord.js";
import { pickOne, randomActivities } from "./utils.js";

const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // six hours

function moodCycle(client) {
	const mood = pickOne(randomActivities);
	client.user.setActivity(mood.trim(), { type: ActivityType.Custom });
	console.log(`Bot status set: ${mood.text.trim()}`);
}

export function startCycleMood(client) {
	moodCycle(client);
	setInterval(() => {
		moodCycle(client).catch(e => console.error('error in moodCycle:', e));
	}, CHECK_INTERVAL);
}
