import * as cv from "opencv4nodejs";

export default class CameraWrapper {

	static grabFrame(devicePort: number): cv.Mat {

		const cap = new cv.VideoCapture(devicePort);

		const img = cap.read();

		cap.release();

		return img;
	}

	static saveVideoClip(devicePort: number, lengthSecs: number, filePath: string, onFrame?: (frame: cv.Mat) => cv.Mat): Promise<void> {

		return new Promise((resolve) => {

			const cap = new cv.VideoCapture(devicePort);
			const fourcc = cv.VideoWriter.fourcc('MP42');
			const size = new cv.Size(cap.get(cv.CAP_PROP_FRAME_WIDTH), cap.get(cv.CAP_PROP_FRAME_HEIGHT));
			const videoWriter = new cv.VideoWriter(filePath, fourcc, cv.CAP_PROP_FPS, size, true);

			let done = false;

			setTimeout(() => {
				done = true;
			}, lengthSecs * 1000);

			const interval = setInterval(() => {
				const frame = cap.read();

				const processedFrame = onFrame ? onFrame(frame) : frame; // TODO: Await
				console.log(filePath, fourcc, cv.CAP_PROP_FPS, size, true);
				videoWriter.write(processedFrame);

				if (done) {
					clearInterval(interval);
					cap.release();
					videoWriter.release();
					resolve();
				}
			}, 50);
		});

	}
}