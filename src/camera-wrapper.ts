import * as cv from "opencv4nodejs";

export default class CameraWrapper {

	doCapture = false;
	savingVideo = false;

	private static waitMs(delayMs: number) {
		return new Promise(resolve => setTimeout(resolve, delayMs));
	}

	static grabSingleFrame(devicePort: number): cv.Mat {

		const cap = new cv.VideoCapture(devicePort);

		const img = cap.read();

		cap.release();

		return img;
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

		const frame = cap.read();

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

	async captureVideo(devicePort: number, delayMs: number, onFrame: (frame: cv.Mat) => Promise<cv.Mat> | cv.Mat): Promise<void> {

		this.doCapture = true;

		const cap = new cv.VideoCapture(devicePort);

		await this.captureRecursive(cap, delayMs, onFrame)

	}

	private async captureRecursive(cap: cv.VideoCapture, delayMs: number, onFrame: (frame: cv.Mat) => Promise<cv.Mat> | cv.Mat) {
		const frame = cap.read();

		await onFrame(frame);

		if (!this.doCapture) {
			cap.release();
		} else {
			await CameraWrapper.waitMs(delayMs);
			await this.captureRecursive(cap, delayMs, onFrame);
		}
	}

	stopCapturingVideo() {
		this.doCapture = false;
	}
}