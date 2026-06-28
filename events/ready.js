import { Events } from 'discord.js';
import { startPeriodicSync } from '../utility/access_data.js';
import { startBirthdayChecker } from '../utility/birthday_checker.js';
import { startCycleMood } from '../utility/update_mood.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		startBirthdayChecker(client);
		startPeriodicSync(client);
		startCycleMood(client);
	},
}
