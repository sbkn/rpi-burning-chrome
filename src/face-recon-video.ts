import * as cv from 'opencv4nodejs';
import {Point2} from "opencv4nodejs";
import {Vec3} from "opencv4nodejs";

const BOUNDING_BOX_COLOR = new Vec3(66, 244, 110);


function grabFrames(videoFile: any, delay: number, onFrame: (frame: cv.Mat) => void): void {
	const cap = new cv.VideoCapture(videoFile);
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
			console.log('Key pressed, exiting.');
		}
	}, 0);
}

const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

const delay = 100;

const index = async (): Promise<void> => {
	grabFrames('./people.mp4', delay, async (frame: cv.Mat) => {

		const grayImg = await frame.bgrToGrayAsync();
		const res = await classifier.detectMultiScaleAsync(grayImg);
		const {objects, numDetections} = res;

		console.log(`Found ${objects.length} objects`);
		console.log("numDetections", JSON.stringify(numDetections));

		objects.forEach(object => {
			frame.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
		});

		cv.imshow('grayImg', grayImg);
		cv.imshow('frame', frame);
	});
};

(async () => {
	await index();
})();