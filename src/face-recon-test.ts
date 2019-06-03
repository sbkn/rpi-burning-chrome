import * as cv from "opencv4nodejs";
import {Vec3, Point2} from "opencv4nodejs";

const INPUT_IMAGE_PATH = "./crowd-img.jpeg";
// const RESULT_IMAGE_PATH = "./result.jpeg";

const BOUNDING_BOX_COLOR = new Vec3(66, 244, 110);

const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

const index = async (): Promise<void> => {

	const img = await cv.imreadAsync(INPUT_IMAGE_PATH);

	const grayImg = await img.bgrToGrayAsync();
	const res = await classifier.detectMultiScaleAsync(grayImg);
	const {objects, numDetections} = res;

	console.log(`Found ${objects.length} objects`);
	console.log("numDetections", JSON.stringify(numDetections));

	objects.forEach(object => {
		img.drawRectangle(new Point2(object.x, object.y), new Point2(object.x + object.width, object.y + object.height), BOUNDING_BOX_COLOR);
	});

	cv.imshow('result-img', img);
	cv.waitKey();
	cv.destroyAllWindows();
	// You could also save the image frame:
	// await cv.imwriteAsync(RESULT_IMAGE_PATH, img);
};

index();