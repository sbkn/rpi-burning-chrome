import * as cv from "opencv4nodejs";
import * as fs from "fs";
import moment from "moment";
import {SlackClient} from "./slack-integration";
import {logger} from "./utils/logger";
import MotionDetection from "./motion-detection";
import FaceRecognition from "./face-recognition";
import CameraWrapper from "./camera-wrapper";

enum Actions {
	HELP = "help",
	STATUS = "status",
	PHOTO = "photo",
	VIDEO = "video"
}

const SLACK_POST_TIMEOUT_SECS = 30; // TODO: Move to config!

class Index {

	slackClient: SlackClient;
	cameraWrapper: CameraWrapper;
	slackPostTimeOut = false; // TODO: Rename this ..

	constructor() {
		this.slackClient = new SlackClient();
		this.cameraWrapper = new CameraWrapper();
	}

	async run() {
		this.slackClient = new SlackClient();
		this.cameraWrapper = await new CameraWrapper();
		await this.slackClient.run(this.handleEvent);
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
				.then((frameBuffer) => {return this.slackClient.uploadFileFromBuffer(frameBuffer, "motion-detected.jpeg")});
		}
		return frame;
	}

	async onAlarmPosted() {
		this.slackPostTimeOut = true;
		await Index.waitMs(SLACK_POST_TIMEOUT_SECS * 1000);
		this.slackPostTimeOut = false;
	}

	private handleEvent = async (event: any) => {

		logger.info(`Received event "${event.text}" from: ${event.user}, ${this.slackClient.activeUserId}`);

		if (event.user === this.slackClient.activeUserId) {
			logger.info("This is my own message, ignoring");
			return;
		}

		if (event.type !== "message") {
			logger.info("This is not a real message, ignoring");
			return;
		}

		if (event.subtype === "message_deleted") {
			logger.info("This is a message_deleted event, ignoring");
			return;
		}

		const action = event.text ? Index.extractActionFromMessage(event.text) : "";

		switch (action) {
			case Actions.HELP:
				await this.processHelpRequest(event.channel);
				break;
			case Actions.STATUS:
				await this.processStatusRequest(event.channel);
				break;
			case Actions.PHOTO:
				await this.processPhotoRequest(event);
				break;
			case Actions.VIDEO:
				await this.processVideoRequest(event);
				break;
			default:
				await this.processHelpRequest(event.channel);
				break;
		}
	};

	private static extractActionFromMessage (message: string) {
		const normalizedMsg = message.toLowerCase().trim();

		for(const action in Actions) {
			if(normalizedMsg.includes(Actions[action])){
				return Actions[action];
			}
		}
		return Actions.HELP;
	};

	private async processHelpRequest(channel: string) {
		try {
			const msg = `Usage:\n\t*help*: Prints usage info\n\t*status*: Returns status of application/RPi\n\t*photo*: Posts a frame from camera\n\t*video*: Posts some seconds of video\n`;
			await this.slackClient.sendMessage(msg, channel);

		} catch (error) {
			logger.error(error.message);
		}
	};

	private async processStatusRequest(channel: string) {
		try {
			const msg = `Not implemented yet!`;
			await this.slackClient.sendMessage(msg, channel);

		} catch (error) {
			logger.error(error.message);
		}
	};

	private async processPhotoRequest(event: any) {
		try {
			await this.slackClient.sendMessage(`Uploading a photo, <@${event.user}>`, event.channel);

			const frame = await this.cameraWrapper.grabSingleFrame();
			await FaceRecognition.markFaceOnImg(frame);
			const frameBuffer = await cv.imencodeAsync(".jpg", frame);
			await this.slackClient.uploadFileFromBuffer(frameBuffer, "Cheeeese.jpg", event.channel);
		} catch (error) {
			logger.error(error.message);
		}
	};

	private async processVideoRequest(event: any) {
		try {
			await this.slackClient.sendMessage(`Uploading a video, <@${event.user}>`, event.channel);

			const filePath = "./vid-clip.mp4";

			await this.cameraWrapper.saveVideoClip(0, 5, filePath, 50, FaceRecognition.markFaceOnImg);

			await this.slackClient.uploadFileFromDisk(filePath, filePath, event.channel);

			fs.unlinkSync(filePath);
		} catch (error) {
			logger.error(error.message);
		}
	};
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