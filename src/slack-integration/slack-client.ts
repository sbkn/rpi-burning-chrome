import RtmWrapper from "./rtm-wrapper";
import WebWrapper from "./web-wrapper";
import {logger} from "../utils/logger";

enum Actions {
	HELP = "help",
	STATUS = "status",
	PHOTO = "photo",
	VIDEO = "video"
}

export default class SlackClient {

	rtmWrapper: RtmWrapper;
	webWrapper: WebWrapper;
	token: string;

	constructor() {

		if (!process.env.SLACK_BOT_TOKEN) {
			logger.error(new Error("Env var SLACK_BOT_TOKEN is not set, exiting."));
			throw new Error("Env var SLACK_BOT_TOKEN not set");
		}

		this.token = process.env.SLACK_BOT_TOKEN!;
		this.rtmWrapper = new RtmWrapper(this.token);
		this.webWrapper = new WebWrapper(this.token)
	}

	async run() {

		await this.rtmWrapper.connect(this.handleEvent);
	}

	private handleEvent = async (event: any) => {

		logger.info(`Received event: ${JSON.stringify(event, null, 2)}`);

		if (event.user === this.rtmWrapper.activeUserId) {
			logger.info("This is my own message, ignoring");
			return;
		}

		if (event.type !== "message") {
			logger.info("This is not a message, ignoring");
			return;
		}

		if (event.subtype === "message_deleted") {
			logger.info("This is a message_deleted event, ignoring");
			return;
		}

		const action = event.text ? SlackClient.extractActionFromMessage(event.text) : "";

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

			const reply = await this.rtmWrapper.sendMessage(msg, channel);
			logger.info("Message sent successfully", reply.ts);

		} catch (error) {
			logger.error(error);
		}
	};

	private async processStatusRequest(channel: string) {
		try {
			const msg = `Not implemented yet!`;

			const reply = await this.rtmWrapper.sendMessage(msg, channel);
			logger.info("Message sent successfully", reply.ts);

		} catch (error) {
			logger.error(error);
		}
	};

	private async processPhotoRequest(event: any) {
		try {
			const reply = await this.rtmWrapper.sendMessage(`Uploading a photo, <@${event.user}>`, event.channel);
			logger.info("Message sent successfully", reply.ts);

			await this.webWrapper.uploadFileFromDisk(event.channel, "./testdata/crowd-img.jpeg");
		} catch (error) {
			logger.error(error);
		}
	};

	private async processVideoRequest(event: any) {
		try {
			const reply = await this.rtmWrapper.sendMessage(`Uploading a video, <@${event.user}>`, event.channel);
			logger.info("Message sent successfully", reply.ts);

			await this.webWrapper.uploadFileFromDisk(event.channel, "./testdata/traffic.mp4");
		} catch (error) {
			logger.error(error);
		}
	};
}