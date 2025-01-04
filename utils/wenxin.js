// import { ChatCompletion } from "@baiducloud/qianfan";
const { ChatCompletion } = require("@baiducloud/qianfan");
const { showLoading, stopLoading } = require("./index");
const fs = require("fs");
const { apiKey, secretKey } = require("../env");

const client = new ChatCompletion({
	QIANFAN_AK: apiKey,
	QIANFAN_SK: secretKey,
});

async function chat(cacheData, id, question) {
	const loadingInterval = showLoading();
	const res = await client.chat({
		messages: [
			{
				role: "user",
				content: question,
			},
		],
		model: "ERNIE-3.5-8K",
	});
	stopLoading(loadingInterval);
	const result = res.result;
	return result;
}

module.exports = {
	chat,
};
