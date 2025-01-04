const readline = require("readline");


function showLoading() {
	const spinner = ["|", "/", "-", "\\"];
	let i = 0;

	const interval = setInterval(() => {
		readline.cursorTo(process.stdout, 0); // 移动光标到行首
		process.stdout.write(`Loading ${spinner[i]}`);
		i = (i + 1) % spinner.length;
	}, 100);

	return interval;
}

function stopLoading(interval) {
	clearInterval(interval);
	readline.cursorTo(process.stdout, 0);
	process.stdout.write("Done!\n");
}

module.exports = {
	showLoading,
	stopLoading,
};
