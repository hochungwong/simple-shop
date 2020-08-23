const fs = require("fs");
const readableStream = fs.createReadStream("message.txt");
const writableStream = fs.createWriteStream("message-copy.txt");

readableStream.setEncoding("utf8");

readableStream.on("data", (chunk) => writableStream.write(chunk));
