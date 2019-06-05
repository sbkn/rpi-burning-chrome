import {SlackClient} from "./slack-integration/index";
import {logger} from "./utils/logger";

(async () => {
	try {
		await new SlackClient().run();
	}
	catch (err) {
		logger.error(err);
		process.exit(1);
	}
})();