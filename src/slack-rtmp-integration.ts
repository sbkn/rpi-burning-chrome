import {RTMClient} from "@slack/rtm-api";
import {WebAPICallResult, WebClient} from "@slack/web-api";
import {createReadStream} from "fs";

const token = process.env.SLACK_BOT_TOKEN!; // TODO
const rtm = new RTMClient(token);

interface StartClientResult extends WebAPICallResult {
	self: {
		name: string;
	};
	team: {
		name: string;
		domain: string;
	}
}

interface FileUploadResult extends WebAPICallResult {
	file: {
		id: string;
	}
}

enum Action {
	HELP = "help",
	STATUS = "status",
	PHOTO = "photo",
	VIDEO = "video"
}

rtm.on('message', async (event: any) => {
	await handleEvent(event);
});

const handleEvent = async (event: any) => {

	console.log(`Bot ID is: ${rtm.activeUserId}`); // TODO: This should be in 'onconnect' or something, also should post message onconnect
	console.log(`Received event: ${JSON.stringify(event, null, 2)}`);

	if (event.user === rtm.activeUserId) {
		console.log("This is my own message, ignoring");
		return;
	}

	switch (event.text) {
		case Action.HELP:
			await processHelpRequest(event.channel);
			break;
		case Action.STATUS:
			await processStatusRequest(event.channel);
			break;
		case Action.PHOTO:
			await processPhotoRequest(event);
			break;
		case Action.VIDEO:
			await processVideoRequest(event);
			break;
		default:
			await processHelpRequest(event.channel);
			break;
	}
};

const processHelpRequest = async (channel: string) => {
	try {

		const msg = `Usage:\n\t*help*: Prints usage info\n\t*status*: Returns status of application/RPi\n\t*photo*: Posts a frame from camera\n\t*video*: Posts some seconds of video\n`;

		const reply = await rtm.sendMessage(msg, channel);
		console.log('Message sent successfully', reply.ts);

	} catch (error) {
		console.log('An error occurred', error);
	}
};

const processStatusRequest = async (channel: string) => {
	try {

		const msg = `Not implemented yet!`;

		const reply = await rtm.sendMessage(msg, channel);
		console.log('Message sent successfully', reply.ts);

	} catch (error) {
		console.log('An error occurred', error);
	}
};

const processPhotoRequest = async (event: any) => {
	try {
		const reply = await rtm.sendMessage(`Uploading a photo, <@${event.user}>`, event.channel);
		console.log('Message sent successfully', reply.ts);


		const token = process.env.SLACK_BOT_TOKEN;
		const web = new WebClient(token);

		const filename = './crowd-img.jpeg';

		const result = await web.files.upload({
			filename,
			channels: event.channel,
			file: createReadStream(filename),
		}) as FileUploadResult;

		console.log('File uploaded: ', result.file && result.file.id); // TODO

	} catch (error) {
		console.log('An error occurred', error);
	}
};

const processVideoRequest = async (event: any) => {
	try {
		const reply = await rtm.sendMessage(`Uploading a video, <@${event.user}>`, event.channel);
		console.log('Message sent successfully', reply.ts);


		const token = process.env.SLACK_BOT_TOKEN;
		const web = new WebClient(token);

		const filename = './traffic.mp4';

		const result = await web.files.upload({
			filename,
			channels: event.channel,
			file: createReadStream(filename),
		}) as FileUploadResult;

		console.log('File uploaded: ', result.file && result.file.id); // TODO

	} catch (error) {
		console.log('An error occurred', error);
	}
};

(async () => {
	try {
		const {self, team} = await rtm.start() as StartClientResult;
		console.log(`Connected as ${self.name} to ${team.name}/${team.domain}`);
	}
	catch (err) {
		console.error("Failed to connect to Slack:", err);
		process.exit(1);
	}
})();