import {WebAPICallResult, WebClient} from "@slack/web-api";
import {createReadStream} from "fs";
import {logger} from "../utils/logger";

const GROUP_NAME = "burning-chrome"; // TODO: Move to config?

interface FileUploadResult extends WebAPICallResult {
	file: {
		id: string;
	};
}

interface GroupsListResult extends WebAPICallResult {
	groups:{
		name: string;
		id: string;
	}[];
}

export default class WebWrapper {

	web: WebClient;

	constructor(token: string) {
		this.web = new WebClient(token);
	}

	async getChannelId(): Promise<string> {
		const groupsListResult = await this.web.groups.list() as GroupsListResult;

		const group = groupsListResult.groups.find(channel => (channel.name === GROUP_NAME));
		if(group && group.id) {
			logger.info(`Active Slack group is ${group.name} / ${group.id}`);
			return group.id;
		}
		throw new Error("Could not find active group!");
	}

	async uploadFileFromDisk(channel: string, filePath: string, title?: string) {

		const result = await this.web.files.upload({
			filename: title || "foo.jpeg",
			channels: channel,
			file: createReadStream(filePath),
		}) as FileUploadResult;

		logger.info('File uploaded: ', result.file && result.file.id);
	}

	async uploadFileFromBuffer(channel: string, buffer: Buffer, fileName: string) {

		const result = await this.web.files.upload({
			filename: fileName,
			channels: channel,
			file: buffer,
		}) as FileUploadResult;

		logger.info('File uploaded: ', result.file && result.file.id);
	}
}