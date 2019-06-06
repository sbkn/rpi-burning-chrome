import * as cv from "opencv4nodejs";

export default class CameraWrapper {

	static grabFrame(devicePort: number): cv.Mat {

		const cap = new cv.VideoCapture(devicePort);

		const img = cap.read();

		cap.release();

		return img;
	}
}