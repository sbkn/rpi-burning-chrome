import * as cv from 'opencv4nodejs';
import moment from "moment";
import {logger} from "./utils/logger";

const bgSubtractor = new cv.BackgroundSubtractorMOG2();

export default class MotionDetection {

	static async processFrame(frame: cv.Mat, frameIndex: number, onDetected: (frame: cv.Mat) => Promise<cv.Mat> | cv.Mat): Promise<cv.Mat> {
		logger.info(`Processing frame ${frameIndex}`);
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
		const motionDetected = await MotionDetection.findMotionInFrame(thresholded, minPxSize);

		if (motionDetected) {
			logger.info(`Motion detected at ${moment().format()}!`);
			await onDetected(frame);
		}

		// cv.imshow('frame', frame);
		// cv.waitKey(20);
		return frame;
	}

	static async findMotionInFrame(binaryImg: cv.Mat, minPxSize: number): Promise<boolean> {
		const {
			centroids,
			stats
		} = await binaryImg.connectedComponentsWithStatsAsync();

		for (let label = 1; label < centroids.rows; label += 1) {

			const size = stats.at(label, cv.CC_STAT_AREA);

			if (minPxSize < size) {
				return true;
			}
		}
		return false;
	}
}
