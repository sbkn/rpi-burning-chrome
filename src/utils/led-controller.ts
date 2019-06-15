import {Gpio, Low} from "onoff";
import {logger} from "./logger";

const GPIO_PIN = 17; // TODO: Rename, export to config etc.
const BLINK_DELAY_MS = 1000; // TODO: Rename, export to config etc.

export default class LedController {

	led: Gpio;
	blinkIntervalRef?: NodeJS.Timeout;

	constructor() {
		if (Gpio.accessible) {
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

	async ledOn(durationSecs: number) {
		try {
			let ledWasBlinking = false;
			if (this.blinkIntervalRef) {
				await this.stopBlinking();
				ledWasBlinking = true;
			}

			await this.led.write(1);
			setTimeout(async () => {
				const currentValue = await this.led.read();
				if (currentValue) {
					await this.led.write(0);
				}
				if (ledWasBlinking) {
					await this.blinkLed();
				}
			}, durationSecs * 1000);

		} catch (e) {
			logger.error(e.message);
			throw new Error("LedController.ledOn() failed");
		}
	}

	async blinkLed() {

		try {
			if (!this.blinkIntervalRef) {
				this.blinkIntervalRef = setInterval(async () => {
					const currentValue = await this.led.read();
					await this.led.write(currentValue === 0 ? 1 : 0);
				}, BLINK_DELAY_MS);
			}

		} catch (e) {
			logger.error(e.message);
			throw new Error("LedController.blinkLed() failed");
		}
	}

	async stopBlinking() {
		if (this.blinkIntervalRef) {
			clearInterval(this.blinkIntervalRef);
			const currentValue = await this.led.read();
			if (currentValue) {
				await this.led.write(0);
			}
		}
	}

	cleanUp() {
		try {
			this.led.unexport();
		} catch (e) {
			logger.error(e.message);
			throw new Error("LedController.cleanUp() failed!");
		}
	}
}
