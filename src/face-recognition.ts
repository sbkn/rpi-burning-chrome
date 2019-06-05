import * as cv from "opencv4nodejs";
import {Vec3, Point2} from "opencv4nodejs";

const BOUNDING_BOX_COLOR = new Vec3(66, 244, 110);

export default class FaceRecognition {

	static async doIt(): Promise<Buffer> {

		const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

		const cap = new cv.VideoCapture(0);

		const img = cap.read();

		const grayImg = await img.bgrToGrayAsync();
		const res = await classifier.detectMultiScaleAsync(grayImg);
		const {objects, numDetections} = res;

		console.log(`Found ${objects.length} objects`);
		console.log("numDetections", JSON.stringify(numDetections));

		objects.forEach(object => {
			img.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
		});

		return await cv.imencodeAsync(".jpg", img);
	}
}
