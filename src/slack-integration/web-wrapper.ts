import {WebAPICallResult, WebClient} from "@slack/web-api";
import {createReadStream} from "fs";
import {logger} from "../utils/logger";

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