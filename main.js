var nodes7 = require("nodes7");
var conn = new nodes7();

var openSocket = require("socket.io-client");
var socket;

var doneReading = false;
var doneWriting = false;
var variables = {
	TEST1: "MR4", // Memory real at MD4
	TEST2: "M32.2", // Bit at M32.2
	TEST3: "M20.0", // Bit at M20.0
	TEST4: "DB1,REAL0.20", // Array of 20 values in DB1
	TEST5: "DB1,REAL4", // Single real value
	TEST6: "DB1,REAL8", // Another single real value
	TEST7: "DB1,INT12.2" // Two integer value array
};

var actuatorData = [];

conn.initiateConnection(
	{ port: 102, host: "192.168.0.2", rack: 0, slot: 1 },
	connected
);

function connected(err) {
	if (typeof err !== "undefined") {
		console.log(err);
		process.exit();
	}
	conn.setTranslationCB(function(tag) {
		return variables[tag];
	});
	socket = openSocket("http://vps699582.ovh.net:3001");

	conn.readAllItems(valuesReady);

	socket.on("connect", () => {
		console.log("connected");
	});

	socket.on("up", actuatorId => {
		conn.writeItems(actuatorId, 1, valuesWritten);
		conn.readAllItems(valuesReady);
	});

	socket.on("down", actuatorId => {
		conn.writeItems(actuatorId, -1, valuesWritten);
		conn.readAllItems(valuesReady);
	});

	socket.on("stop", actuatorId => {
		conn.writeItems(actuatorId, 0, valuesWritten);
		conn.readAllItems(valuesReady);
	});
}

function valuesReady(anythingBad, values) {
	if (anythingBad) {
		console.log("SOMETHING WENT WRONG READING VALUES!!!!");
	}
	console.log(values);
	doneReading = true;
	if (doneWriting) {
		socket.emit("data", actuatorData);
		process.exit();
	}
}

function valuesWritten(anythingBad) {
	if (anythingBad) {
		console.log("SOMETHING WENT WRONG WRITING VALUES!!!!");
	}
	console.log("Done writing.");
	doneWriting = true;
	if (doneReading) {
		process.exit();
	}
}
