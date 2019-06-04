# rpi-burning-chrome

### This be motion detection and such for RPi

### Requirements for building (run before `npm install`!):
 - MacOS:
	```
	brew install cmake
	```
 - RPi:
	```
	sudo apt-get install cmake
	sudo apt-get install libgtk2.0-dev libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev libx264-dev
	sudo apt-get install libjpeg-dev libpng-dev libtiff-dev zlib1g-dev
	sudo apt-get install libatlas-base-dev gfortran
	export PKG_CONFIG_PATH=/usr/lib/arm-linux-gnueabihf/pkgconfig/
	export PKG_CONFIG_LIBDIR=/usr/lib/arm-linux-gnueabihf/pkgconfig/
	```

### Requirements for running:
 - Set env var `SLACK_BOT_TOKEN`, this should be something like `xoxb-...`


### Staging:
 - Set env var `NODE_ENV=production` for production mode.

### Using example code from [opencv4nodejs](https://github.com/justadudewhohacks/opencv4nodejs)

## TODO:
 - https://raspberrypi.stackexchange.com/questions/15454/detect-if-iphone-android-nearby
 - https://github.com/slackapi/node-slack-sdk (https://slack.dev/node-slack-sdk/rtm-api)
 - https://www.pyimagesearch.com/2015/06/01/home-surveillance-and-motion-detection-with-the-raspberry-pi-python-and-opencv/