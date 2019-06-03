const { RTMClient } = require('@slack/rtm-api');
const token = process.env.SLACK_BOT_TOKEN;
const rtm = new RTMClient(token);

rtm.on('message', async (event: any) => {
	try {
		console.log(`Received event: ${JSON.stringify(event)}`);
		const reply = await rtm.sendMessage(`What do you want, <@${event.user}>?`, event.channel);
		console.log('Message sent successfully', reply.ts);
	} catch (error) {
		console.log('An error occurred', error);
	}
});

(async () => {
	await rtm.start();
})();