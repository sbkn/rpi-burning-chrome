import {SlackClient} from "./slack-integration";
import {logger} from "./utils/logger";
import MotionDetection from "./motion-detection";

(async () => {
	try {
		await new SlackClient().run();
		 await MotionDetection.run();
	}
	catch (err) {
		logger.error(err);
		process.exit(1);
	}
})();