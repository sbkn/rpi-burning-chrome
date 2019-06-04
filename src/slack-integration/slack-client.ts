import RtmWrapper from "./rtm-wrapper";
import WebWrapper from "./web-wrapper";

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
			console.error("Env var SLACK_BOT_TOKEN is not set, exiting.");
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

		console.log(`Received event: ${JSON.stringify(event, null, 2)}`);

		if (event.user === this.rtmWrapper.activeUserId) {
			console.log("This is my own message, ignoring");
			return;
		}

		if (event.type !== "message") {
			console.log("This is not a message, ignoring");
			return;
		}

		if (event.subtype === "message_deleted") {
			console.log("This is a message_deleted event, ignoring");
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
			console.log("Message sent successfully", reply.ts);

		} catch (error) {
			console.log("An error occurred", error);
		}
	};

	private async processStatusRequest(channel: string) {
		try {
			const msg = `Not implemented yet!`;

			const reply = await this.rtmWrapper.sendMessage(msg, channel);
			console.log("Message sent successfully", reply.ts);

		} catch (error) {
			console.log("An error occurred", error);
		}
	};

	private async processPhotoRequest(event: any) {
		try {
			const reply = await this.rtmWrapper.sendMessage(`Uploading a photo, <@${event.user}>`, event.channel);
			console.log("Message sent successfully", reply.ts);

			await this.webWrapper.uploadFileFromDisk(event.channel, "./crowd-img.jpeg");
		} catch (error) {
			console.log("An error occurred", error);
		}
	};

	private async processVideoRequest(event: any) {
		try {
			const reply = await this.rtmWrapper.sendMessage(`Uploading a video, <@${event.user}>`, event.channel);
			console.log("Message sent successfully", reply.ts);

			await this.webWrapper.uploadFileFromDisk(event.channel, "./traffic.mp4");
		} catch (error) {
			console.log("An error occurred", error);
		}
	};
}

(async () => {
	try {
		await new SlackClient().run();
	}
	catch (err) {
		console.error("Failed to connect to Slack:", err);
		process.exit(1);
	}
})();