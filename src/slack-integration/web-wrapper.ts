import {WebAPICallResult, WebClient} from "@slack/web-api";
import {createReadStream} from "fs";

interface FileUploadResult extends WebAPICallResult {
	file: {
		id: string;
	};
}

export default class WebWrapper {

	web: WebClient;

	constructor(token: string) {
		this.web = new WebClient(token);
	}

	async uploadFileFromDisk(channel: string, filePath: string) {

		const result = await this.web.files.upload({
			filename: filePath,
			channels: channel,
			file: createReadStream(filePath),
		}) as FileUploadResult;

		console.log('File uploaded: ', result.file && result.file.id);
	}
}