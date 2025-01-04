// 保存题集上次看到的位置
const cache = require("../cache.json");
const fs = require("fs");
const path = require("path");
const updateCache = (id, index) => {
	const data = cache.find(item => item.id === id);
	if (data) {
		data.index = index;
	} else {
		cache.push({ id, index });
	}
	fs.writeFileSync(
		path.resolve(__dirname, "../cache.json"),
		JSON.stringify(cache, null, 4)
	);
};

module.exports = {
	updateCache,
};
