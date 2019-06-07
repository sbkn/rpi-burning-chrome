import * as cv from 'opencv4nodejs';
import {logger} from "./utils/logger";
import CameraWrapper from "./camera-wrapper";
import FaceRecognition from "./face-recognition";

const bgSubtractor = new cv.BackgroundSubtractorMOG2();

export default class MotionDetection {

	static async run() {

		await new CameraWrapper().captureVideo(0, 200, MotionDetection.processFrame);
	}

	static processFrame(frame: cv.Mat) {

		const foreGroundMask = bgSubtractor.apply(frame);

		const iterations = 2;
		const dilated = foreGroundMask.dilate(
			cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
			new cv.Point2(-1, -1),
			iterations
		);

		const blurred = dilated.blur(new cv.Size(10, 10));
		const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

		const minPxSize = 2000; // TODO: Find okay value
		drawRectAroundBlobs(thresholded, frame, minPxSize);
		cv.imshow('frame', frame);
		cv.waitKey(20);
		return frame;
	}
}


function drawRectAroundBlobs(binaryImg: cv.Mat, dstImg: cv.Mat, minPxSize: number, fixedRectWidth?: number): void {
	const {
		centroids,
		stats
	} = binaryImg.connectedComponentsWithStats();
	let found = false;
	// pretend label 0 is background
	for (let label = 1; label < centroids.rows; label += 1) {
		const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
		const [x2, y2] = [
			x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
			y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
		];
		const size = stats.at(label, cv.CC_STAT_AREA);
		// const blue = new cv.Vec3(255, 0, 0);

		if (minPxSize < size) {
			found = true;
			/*dstImg.drawRectangle(
				new cv.Point2(x1, y1),
				new cv.Point2(x2, y2),
				blue,
				2
			);*/
			FaceRecognition.markFaceOnImg(dstImg); // TODO
		}
	}
	// found? cv.imshowWait('frame', binaryImg): () => {};
}
