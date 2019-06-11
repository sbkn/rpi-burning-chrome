import * as cv from "opencv4nodejs";
import moment from "moment";
import {SlackClient} from "./slack-integration";
import {logger} from "./utils/logger";
import MotionDetection from "./motion-detection";
import FaceRecognition from "./face-recognition";

const SLACK_POST_TIMEOUT_SECS = 30; // TODO: Move to config!

class Index {

	slackClient = new SlackClient;
	slackPostTimeOut = false; // TODO: Rename this ..

	async run() {
		this.slackClient = await new SlackClient();
		await this.slackClient.run();
		await MotionDetection.run(this.onMotionDetected.bind(this));
	}

	private static waitMs(delayMs: number) {
		return new Promise(resolve => setTimeout(() => {
			logger.debug(`waited ${delayMs} ms`);
			resolve();
		}, delayMs));
	}

	async onMotionDetected(frame: cv.Mat): Promise<cv.Mat> {
		if (!this.slackPostTimeOut) {
			this.slackClient.sendMessage(`Motion detected at ${moment().format("DD.MM.YYYY - HH:mm:ss")}!`)
				.then(this.onAlarmPosted.bind(this));
			FaceRecognition.markFaceOnImg(frame)
				.then(() => cv.imencodeAsync(".jpg", frame))
				.then((frameBuffer) => {return this.slackClient.uploadFileFromBuffer(frameBuffer)});
		}

		return frame;
	}

	async onAlarmPosted() {
		this.slackPostTimeOut = true;
		await Index.waitMs(SLACK_POST_TIMEOUT_SECS * 1000);
		this.slackPostTimeOut = false;
	}
}

(async () => {
	try {
		await new Index().run();
	}
	catch (err) {
		logger.error(err);
		process.exit(1);
	}
})();