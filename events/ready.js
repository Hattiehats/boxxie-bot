import { Events } from 'discord.js';
import { startPeriodicSync } from '../utility/access_data.js';
import { startCycleMood } from '../utility/update_mood.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		// Periodic Sync now runs the birthday checker as part of it
		// startBirthdayChecker(client);
		startPeriodicSync(client);
		startCycleMood(client);
	},
}
