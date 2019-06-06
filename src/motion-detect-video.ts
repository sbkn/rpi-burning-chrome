import * as cv from 'opencv4nodejs';
import {logger} from "./utils/logger";


function grabFrames (videoFile: any, delay: number, onFrame: (frame: cv.Mat) => void): void {
	const cap = new cv.VideoCapture(0);
	let done = false;
	const intvl = setInterval(() => {
		let frame = cap.read();
		// loop back to start on end of stream reached
		if (frame.empty) {
			cap.reset();
			frame = cap.read();
		}
		onFrame(frame);

		const key = cv.waitKey(delay);
		done = key !== -1 && key !== 255;
		if (done) {
			clearInterval(intvl);
			logger.info('Key pressed, exiting.');
		}
	}, 0);
}

function drawRectAroundBlobs (binaryImg: cv.Mat, dstImg: cv.Mat, minPxSize: number, fixedRectWidth?: number): void {
	const {
		centroids,
		stats
	} = binaryImg.connectedComponentsWithStats();

	// pretend label 0 is background
	for (let label = 1; label < centroids.rows; label += 1) {
		const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
		const [x2, y2] = [
			x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
			y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
		];
		const size = stats.at(label, cv.CC_STAT_AREA);
		const blue = new cv.Vec3(255, 0, 0);
		if (minPxSize < size) {
			dstImg.drawRectangle(
				new cv.Point2(x1, y1),
				new cv.Point2(x2, y2),
				blue,
				2
			);
		}
	}
}

const bgSubtractor = new cv.BackgroundSubtractorMOG2();

const delay = 20;
grabFrames('./testdata/traffic.mp4', delay, (frame: cv.Mat) => {
	const foreGroundMask = bgSubtractor.apply(frame);

	const iterations = 2;
	const dilated = foreGroundMask.dilate(
		cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
		new cv.Point2(-1, -1),
		iterations
	);
	const blurred = dilated.blur(new cv.Size(10, 10));
	const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

	const minPxSize = 4000;
	drawRectAroundBlobs(thresholded, frame, minPxSize);

	cv.imshow('foreGroundMask', foreGroundMask);
	cv.imshow('thresholded', thresholded);
	cv.imshow('frame', frame);
});