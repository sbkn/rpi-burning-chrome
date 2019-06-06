import * as cv from "opencv4nodejs";
import {Vec3, Point2} from "opencv4nodejs";
import CameraWrapper from "./camera-wrapper";
import {logger} from "./utils/logger";

const BOUNDING_BOX_COLOR = new Vec3(66, 244, 110);

export default class FaceRecognition {

	static async camFrameJpg(): Promise<Buffer> {

		const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

		const img = CameraWrapper.grabFrame(0);

		const grayImg = await img.bgrToGrayAsync();
		const res = await classifier.detectMultiScaleAsync(grayImg);
		const {objects, numDetections} = res;

		logger.info(`Found ${objects.length} objects`);
		logger.info("numDetections", JSON.stringify(numDetections));

		objects.forEach(object => {
			img.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
		});

		return await cv.imencodeAsync(".jpg", img);
	}

	static async camVideoToDisk(filePath: string): Promise<string> {

		await CameraWrapper.saveVideoClip(0, 5, filePath, FaceRecognition.processVideoFrame);

		return filePath;
	}

	private static processVideoFrame(frame: cv.Mat): cv.Mat {

		const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

		const grayImg = frame.bgrToGray();
		const res = classifier.detectMultiScale(grayImg);
		const {objects, numDetections} = res;

		logger.info(`Found ${objects.length} objects`);
		logger.info("numDetections", JSON.stringify(numDetections));

		objects.forEach(object => {
			frame.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
		});

		return frame;
	}
}
