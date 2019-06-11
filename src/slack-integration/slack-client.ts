import * as fs from "fs";
import RtmWrapper from "./rtm-wrapper";
import WebWrapper from "./web-wrapper";
import {logger} from "../utils/logger";
import FaceRecognition from "../face-recognition";

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
	activeChannelId?: string;

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

		this.activeChannelId = await this.webWrapper.getChannelId();
		await this.rtmWrapper.connect(this.handleEvent);
	}

	async sendMessage(message: string, channel?: string): Promise<void> {
		if(!channel && !this.activeChannelId) {
			this.activeChannelId = await this.webWrapper.getChannelId();
		}
		const reply = await this.rtmWrapper.sendMessage(message, channel || this.activeChannelId!); // TODO: This '!'
		logger.info("Message sent successfully", reply.ts);
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

			const pic = await FaceRecognition.camFrameJpg();

			await this.webWrapper.uploadFileFromBuffer(event.channel, pic, "Cheeeese.jpg");
		} catch (error) {
			logger.error(error);
		}
	};

	private async processVideoRequest(event: any) {
		try {
			const reply = await this.rtmWrapper.sendMessage(`Uploading a video, <@${event.user}>`, event.channel);
			logger.info("Message sent successfully", reply.ts);

			const filePath = "./vid-clip.mp4";

			await FaceRecognition.camVideoToDisk(filePath);

			await this.webWrapper.uploadFileFromDisk(event.channel, filePath);

			fs.unlinkSync(filePath);
		} catch (error) {
			logger.error(error);
		}
	};

	async uploadFileFromBuffer(file: Buffer, title?: string, channel?: string) {
		return this.webWrapper.uploadFileFromBuffer(channel || this.activeChannelId!, file, title || ""); // TODO: This '!'
	}
}