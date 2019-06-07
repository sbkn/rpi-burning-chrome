import * as cv from "opencv4nodejs";

export default class CameraWrapper {

	doCapture = false;

	static grabSingleFrame(devicePort: number): cv.Mat {

		const cap = new cv.VideoCapture(devicePort);

		const img = cap.read();

		cap.release();

		return img;
	}

	static saveVideoClip(devicePort: number, lengthSecs: number, filePath: string, delayMs: number, onFrame?: (frame: cv.Mat) => cv.Mat): Promise<void> {

		return new Promise((resolve) => {

			const cap = new cv.VideoCapture(devicePort);
			const fourcc = cv.VideoWriter.fourcc('FMP4');
			const size = new cv.Size(cap.get(cv.CAP_PROP_FRAME_WIDTH), cap.get(cv.CAP_PROP_FRAME_HEIGHT));
			const videoWriter = new cv.VideoWriter(filePath, fourcc, cv.CAP_PROP_FPS, size, true);

			let done = false;

			setTimeout(() => {
				done = true;
			}, lengthSecs * 1000);

			const interval = setInterval(() => {
				const frame = cap.read();

				const processedFrame = onFrame ? onFrame(frame) : frame; // TODO: Make this async, onFrame should be able to be async
				videoWriter.write(processedFrame);

				if (done) {
					clearInterval(interval);
					cap.release();
					videoWriter.release();
					resolve();
				}
			}, delayMs);
		});
	}

	captureVideo(devicePort: number, delayMs: number, onFrame: (frame: cv.Mat) => cv.Mat): Promise<void> {

		this.doCapture = true;

		return new Promise((resolve) => {

			const cap = new cv.VideoCapture(devicePort);

			const interval = setInterval(() => {
				const frame = cap.read();

				onFrame(frame);

				if (!this.doCapture) {
					clearInterval(interval);
					cap.release();
					resolve();
				}
			}, delayMs);
		});
	}

	stopCapturingVideo() {
		this.doCapture = false;
	}
}