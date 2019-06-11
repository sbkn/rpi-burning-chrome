import * as cv from "opencv4nodejs";
import {logger} from "./utils/logger";

let FRAME_COUNTER = 1; // TODO: remove debug

export default class CameraWrapper {

	doCapture = false;
	savingVideo = false;

	private static waitMs(delayMs: number) {
		return new Promise(resolve => setTimeout(() => {
			logger.debug(`waited ${delayMs} ms`);
			resolve();
		}, delayMs));
	}

	static async grabSingleFrame(devicePort: number): Promise<cv.Mat> {

		try {
			const cap = new cv.VideoCapture(devicePort);

			const img = await cap.readAsync();

			cap.release();

			return img;
		} catch (e) {
			logger.error(e);
			throw new Error("CameraWrapper.grabSingleFrame crashed");
		}
	}

	async saveVideoClip(devicePort: number, lengthSecs: number, filePath: string, delayMs: number, onFrame?: (frame: cv.Mat) => Promise<cv.Mat> | cv.Mat): Promise<void> {

		const cap = new cv.VideoCapture(devicePort);
		const fourcc = cv.VideoWriter.fourcc('FMP4');
		const size = new cv.Size(cap.get(cv.CAP_PROP_FRAME_WIDTH), cap.get(cv.CAP_PROP_FRAME_HEIGHT));
		const videoWriter = new cv.VideoWriter(filePath, fourcc, cv.CAP_PROP_FPS, size, true);

		this.savingVideo = true;

		setTimeout(() => {
			this.savingVideo = false;
		}, lengthSecs * 1000);

		await this.processCaptureRecursive(cap, videoWriter, delayMs, onFrame)
	}

	private async processCaptureRecursive(cap: cv.VideoCapture, videoWriter: cv.VideoWriter, delayMs: number, onFrame?: (frame: cv.Mat) => Promise<cv.Mat> | cv.Mat) {

		const frame = await cap.readAsync();

		const processedFrame = onFrame ? await onFrame(frame) : frame;
		await videoWriter.writeAsync(processedFrame);

		if (!this.savingVideo) {
			cap.release();
			videoWriter.release();
		} else {
			await CameraWrapper.waitMs(delayMs);
			await this.processCaptureRecursive(cap, videoWriter, delayMs, onFrame);
		}
	}

	async captureVideo(devicePort: number, delayMs: number, onFrame: (frame: cv.Mat, frameIndex: number) => Promise<cv.Mat> | cv.Mat): Promise<void> {
		// TODO: Check if cap is already open (in C++: cap.isOpened());
		this.doCapture = true;
		logger.info(`Capturing video with ${cv.CAP_PROP_FPS} FPS`);
		const cap = new cv.VideoCapture(devicePort);

		await cap.setAsync(cv.CAP_PROP_FRAME_WIDTH, 1280); // TODO: Make these arguments
		await cap.setAsync(cv.CAP_PROP_FRAME_HEIGHT, 720);

		await this.captureRecursive(cap, delayMs, onFrame);
	}

	private async captureRecursive(cap: cv.VideoCapture, delayMs: number, onFrame: (frame: cv.Mat, frameIndex: number) => Promise<cv.Mat> | cv.Mat): Promise<void> {

		const hrStart = process.hrtime();
		logger.debug("capturing recursively");

		const frame = await cap.readAsync();
		const hrRead = process.hrtime(hrStart);
		logger.debug(`frame read in ${(hrRead[0] * 1e9 + hrRead[1]) / 1e6} ms`);
		await onFrame(frame, FRAME_COUNTER);
		const hrProcessed = process.hrtime(hrStart);
		logger.debug(`frame processed in ${(hrProcessed[0] * 1e9 + hrProcessed[1]) / 1e6} ms`);
		if (!this.doCapture) {
			cap.release();
		} else {
			const hrProcessing = process.hrtime(hrStart);
			const msProcessing = (hrProcessing[0] * 1e9 + hrProcessing[1]) / 1e6;
			await CameraWrapper.waitMs(delayMs - msProcessing > 0 ? delayMs - msProcessing : 0);
			const hrEnd = process.hrtime(hrStart);
			logger.debug(`TOTAL Processing frame ${FRAME_COUNTER} took ${(hrEnd[0] * 1e9 + hrEnd[1]) / 1e6} ms`);
			FRAME_COUNTER++;
			return this.captureRecursive(cap, delayMs, onFrame);
		}
	}

	stopCapturingVideo() {
		this.doCapture = false;
	}
}