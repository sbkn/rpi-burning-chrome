import {Gpio, Low} from "onoff";
import {logger} from "./logger";

const GPIO_PIN = 17; // TODO: Rename, export to config etc.
const BLINK_DELAY_MS = 1000; // TODO: Rename, export to config etc.

export default class LedController {

	led: Gpio;
	blinkIntervalRef?: NodeJS.Timeout;

	constructor() {
		if(Gpio.accessible) {
			logger.debug("Gpio is accessible");
			this.led = new Gpio(GPIO_PIN, "out");
		} else {
			// @ts-ignore
			this.led = {
				read: () => logger.info("Gpio is not accessible!") && Promise.resolve(0 as Low),
				write: () => logger.info("Gpio is not accessible!") && Promise.resolve(),
				unexport: () => logger.info("Gpio is not accessible!")
			};
		}
	}

	async blinkLed() {

		try {
			this.blinkIntervalRef = setInterval(async () => { // TODO: Refactor this mess
				const currentValue = await this.led.read();
				await this.led.write(currentValue === 0 ? 1 : 0);
			}, BLINK_DELAY_MS);

		}catch (e) {
			logger.error(e.message);
			throw new Error("LedController.blinkLed() failed");
		}
	}

	stopBlinking() {
		if(this.blinkIntervalRef) {
			clearInterval(this.blinkIntervalRef);
		}
	}

	cleanUp() {
		this.led.unexport();
	}
}
