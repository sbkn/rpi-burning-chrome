import * as cv from "opencv4nodejs";
import {Vec3, Point2} from "opencv4nodejs";
import {logger} from "./utils/logger";

const BOUNDING_BOX_COLOR = new Vec3(66, 244, 110);

export default class FaceRecognition {

	static async markFaceOnImg(img: cv.Mat): Promise<cv.Mat> {

		const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

		const grayImg = await img.bgrToGrayAsync();
		const res = await classifier.detectMultiScaleAsync(grayImg);
		const {objects, numDetections} = res;

		logger.info(`Found ${objects.length} objects`);
		logger.info(`numDetections ${JSON.stringify(numDetections)}`);

		objects.forEach(object => {
			img.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
		});

		return img;
	}
}
