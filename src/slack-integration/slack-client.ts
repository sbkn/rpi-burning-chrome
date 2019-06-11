import RtmWrapper from "./rtm-wrapper";
import WebWrapper from "./web-wrapper";
import {logger} from "../utils/logger";

export default class SlackClient {

	rtmWrapper: RtmWrapper;
	webWrapper: WebWrapper;
	token: string;
	activeChannelId?: string;
	activeUserId?: string;

	constructor() {

		if (!process.env.SLACK_BOT_TOKEN) {
			logger.error(new Error("Env var SLACK_BOT_TOKEN is not set, exiting."));
			throw new Error("Env var SLACK_BOT_TOKEN not set");
		}

		this.token = process.env.SLACK_BOT_TOKEN!;
		this.rtmWrapper = new RtmWrapper(this.token);
		this.webWrapper = new WebWrapper(this.token)
	}

	async run(handleEvent: (event: any) => {}) {

		this.activeChannelId = await this.webWrapper.getChannelId();
		await this.rtmWrapper.connect(handleEvent);
		this.activeUserId = this.rtmWrapper.activeUserId;
	}

	async sendMessage(message: string, channel?: string): Promise<void> {
		if(!channel && !this.activeChannelId) {
			this.activeChannelId = await this.webWrapper.getChannelId();
		}
		const reply = await this.rtmWrapper.sendMessage(message, channel || this.activeChannelId!); // TODO: This '!'
		logger.info("Message sent successfully", reply.ts);
	}

	async uploadFileFromBuffer(file: Buffer, title?: string, channel?: string) {
		return this.webWrapper.uploadFileFromBuffer(channel || this.activeChannelId!, file, title || ""); // TODO: This '!'
	}

	async uploadFileFromDisk(filePath: string, title?: string, channel?: string) {
		return this.webWrapper.uploadFileFromDisk(channel || this.activeChannelId!, filePath, title || ""); // TODO: This '!'
	}
}