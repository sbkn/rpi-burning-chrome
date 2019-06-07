import * as cv from 'opencv4nodejs';
import {logger} from "./utils/logger";
import CameraWrapper from "./camera-wrapper";
import FaceRecognition from "./face-recognition";

const bgSubtractor = new cv.BackgroundSubtractorMOG2();

export default class MotionDetection {

	static async run() {

		await new CameraWrapper().captureVideo(0, 200, MotionDetection.processFrame);
	}

	static async processFrame(frame: cv.Mat): Promise<cv.Mat> {

		const foreGroundMask = bgSubtractor.apply(frame);

		const iterations = 2;
		const dilated = await foreGroundMask.dilateAsync(
			cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
			new cv.Point2(-1, -1),
			iterations
		);

		const blurred = await dilated.blurAsync(new cv.Size(10, 10));
		const thresholded = await blurred.thresholdAsync(200, 255, cv.THRESH_BINARY);

		const minPxSize = 2000; // TODO: Find okay value
		await MotionDetection.drawRectAroundBlobs(thresholded, frame, minPxSize);
		cv.imshow('frame', frame);
		cv.waitKey(20);
		return frame;
	}

	static async drawRectAroundBlobs(binaryImg: cv.Mat, dstImg: cv.Mat, minPxSize: number, fixedRectWidth?: number): Promise<void> {
		const {
			centroids,
			stats
		} = await binaryImg.connectedComponentsWithStatsAsync();
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
				await FaceRecognition.markFaceOnImg(dstImg); // TODO
			}
		}
	}
}
