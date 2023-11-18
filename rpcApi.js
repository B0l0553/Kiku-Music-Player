const rpc = require("discord-rpc");
const client = new rpc.Client({transport: 'ipc'});
var currentActivity = { activity: { timestamps: {}, assets: {}}};
client.login({clientId: "710385949699473441"}).catch(console.error);

client.on("ready", ()=> {
	console.warn("Discord Presence Ready!");
})

function SetRPC(
	_details="text", 
	_status="text",
	_thumb="",
	_thumbT="text"
	) {

	currentActivity = { 
		pid: process.pid,
		activity : {
			details: _details,
			state: _status,
			timestamps: {
			},
			assets:{
				large_image: "aw",
				large_text: _thumbT
			} 
		}
	};
}

function PauseRPC() {
	client.clearActivity(process.pid);
}

function StartRPC(_start = 1, _end = 2) {
	currentActivity.activity.timestamps.start = Date.now();
	currentActivity.activity.timestamps.end = Date.now() + _end * 1000 - _start * 1000;
	client.request('SET_ACTIVITY', currentActivity);
}

module.exports = {
	SetRPC,
	StartRPC,
	PauseRPC
}