import {RTMClient} from "@slack/rtm-api";
import {WebAPICallResult} from "@slack/web-api";

interface StartClientResult extends WebAPICallResult {
	self: {
		name: string;
	};
	team: {
		name: string;
		domain: string;
	};
}

export default class RtmWrapper {

	token: string;
	rtm: RTMClient;
	activeUserId?: string;

	constructor(token: string) {
		this.token = token;
		this.rtm = new RTMClient(token);
	}

	async connect(onMessage: (msg: string) => {}) {

		try {
			const {self, team} = await this.rtm.start() as StartClientResult;
			console.log(`Connected as ${self.name} to ${team.name}/${team.domain}`);
			console.log(`Bot ID is: ${this.rtm.activeUserId}`);
			this.activeUserId = this.rtm.activeUserId;
		}
		catch (err) {
			console.error("Failed to connect to Slack:", err);
			process.exit(1);
		}

		this.rtm.on("message", async (event: any) => {
			await onMessage(event);
		});
	};

	async sendMessage(message: string, channel: string) {

		await this.rtm.sendTyping(channel);
		return this.rtm.sendMessage(message, channel);
	}
}