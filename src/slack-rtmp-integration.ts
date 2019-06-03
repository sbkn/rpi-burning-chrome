const {RTMClient} = require('@slack/rtm-api');
const {WebClient} = require('@slack/web-api');
const {createReadStream} = require('fs');
const token = process.env.SLACK_BOT_TOKEN;
const rtm = new RTMClient(token);

rtm.on('message', async (event: any) => {
	try {
		console.log(`Received event: ${JSON.stringify(event)}`);
		const reply = await rtm.sendMessage(`What do you want, <@${event.user}>?`, event.channel);
		console.log('Message sent successfully', reply.ts);


		const token = process.env.SLACK_BOT_TOKEN;
		const web = new WebClient(token);

		const filename = './crowd-img.jpeg';

		const result = await web.files.upload({
			filename,
			channels: event.channel,
			file: createReadStream(filename),
		});

		console.log('File uploaded: ', JSON.stringify(result.file));
		// TODO: This will rerun because img is also a new message, thus triggers the event we're listening to :)

	} catch (error) {
		console.log('An error occurred', error);
	}
});

(async () => {
	await rtm.start();
})();