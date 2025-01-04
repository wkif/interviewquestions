const axios = require("axios");
const cheerio = require("cheerio");
let AnsData = require("./data.json");
let CacheData = require("./cache.json");
const { chat } = require("./utils/wenxin");
const { updateCache } = require("./utils/cache");
const fs = require("fs");

const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// 提问函数
function askQuestion(query) {
	return new Promise(resolve => rl.question(query, resolve));
}
const getList = async () => {
	try {
		const url = "https://api.mianshiya.com/api/question_bank/list/page/vo";
		const params = { current: 1, pageSize: "127", tagList: ["前端"] };
		
		// 添加请求头和其他配置
		const config = {
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			},
			// 允许自动跟随重定向
			maxRedirects: 5,
			// 验证SSL证书
			httpsAgent: new (require('https').Agent)({  
				rejectUnauthorized: false
			})
		};

		const response = await axios.post(url, params, config);
		const { code, data } = response.data;
		
		if (code === 0) {
			return data.records;
		} else {
			console.log("请求失败", data);
			return [];
		}
	} catch (error) {
		console.error("获取题目列表失败:", error.message);
		return [];
	}
};
const getQuestionList = async id => {
	const url = "https://www.mianshiya.com/bank/" + id;
	const html = (await axios.get(url)).data;
	const $ = cheerio.load(html);
	const cells = $("td.ant-table-cell");
	const list = [];
	cells.each((index, element) => {
		const td = $(element);
		if (td.children().length === 1 && td.find("a[href]").length === 1) {
			const href = td.find("a").attr("href");
			list.push({
				index,
				id: href,
				title: td.text(),
			});
		}
	});
	return list;
};

async function main() {
	let bookList = [];
	console.log("💤! 回复l表示查看题集列表, 回复q退出，回复c清除缓存 !💤");
	const l = await askQuestion("💤💤请输入命令:");
	if (l === "l") {
		bookList = await getList();
		console.log(
			"-------------------------------------------------------------------------------------------\n"
		);
		bookList.forEach((book, index) => {
			console.log(`💤 ${index}: ${book.title}`);
		});
		console.log(
			"-------------------------------------------------------------------------------------------\n"
		);
	} else if (l === "q") {
		console.log("Exiting...");
		process.exit(0);
	} else if (l === "c") {
		CacheData = [];
		fs.writeFileSync("./cache.json", JSON.stringify(CacheData, null, 4));
		console.log("💤缓存已清除!💤");
		main();
	}
	let questionList = [];
	let index = 0;
	const input = await askQuestion("💤请输入题集序号: ");
	const trimmedInput = input.trim();
	if (trimmedInput === "") {
		console.log("输入不能为空，请重新输入。");
		main();
	} else {
		const parsedIndex = parseInt(trimmedInput, 10);
		if (isNaN(parsedIndex)) {
			console.log("请输入有效的数字。");
			main();
		} else {
			index = parsedIndex;
			console.log("💤题集序号:", index);
		}
	}
	const bookId = bookList[index].id;
	lastIndex = CacheData.find(item => item.id === bookId)?.index || 0;
	questionList = await getQuestionList(bookId);
	let currentQuestionIndex = lastIndex;
	console.log("🥣上次看到第", currentQuestionIndex, "题🥣\n\n");
	async function askQuestionList() {
		if (currentQuestionIndex < questionList.length) {
			const question = questionList[currentQuestionIndex].title;
			// 跳过以 VIP 开头的题目
			if (question.startsWith("VIP")) {
				currentQuestionIndex++;
				askQuestionList();
				return;
			}
			const id = questionList[currentQuestionIndex].id;
			updateCache(bookId, currentQuestionIndex);
			const answer = await askQuestion(
				"(" +
					currentQuestionIndex +
					"/" +
					questionList.length +
					")问题是：" +
					question +
					"\n(一共有" +
					questionList.length +
					"题, 输入q退出,输入a使用AI搜索答案， 输入1查看答案，u查看上一题，输入tx跳转到第x题)\n\n"
			);
			if (answer.startsWith("t")) {
				const x = answer.split("t")[1];
				console.log("将跳转到第", x, "题");
				currentQuestionIndex = x;
				askQuestionList();
				return;
			}

			// 检查是否输入 'q' 来退出
			if (answer.toLowerCase() === "q") {
				console.log("Exiting...");
				process.exit(0); // 正常退出程序
			}

			if (answer == 1) {
				const data = AnsData.find(item => item.id === id);
				if (data) {
					console.log(
						"-------------------------问题答案是：-------------------------------\n"
					);
					console.log(data.answer);
					console.log(
						"--------------------------------------------------------\n"
					);
				} else {
					reply = await chat(AnsData, id, question);

					// 将新数据添加到 AnsData
					AnsData.push({
						id: id,
						answer: reply,
					});

					// 将更新后的数据写入文件
					fs.writeFileSync(
						"./data.json",
						JSON.stringify(AnsData, null, 4),
						"utf8"
					);
					console.log(
						"-------------------------问题答案是：-------------------------------\n"
					);
					console.log(reply);
					console.log(
						"--------------------------------------------------------\n"
					);
				}
			}
			if (answer.toLowerCase() === "a") {
				reply = await chat(AnsData, id, question);
				// 将新数据添加到 AnsData
				AnsData.push({
					id: id,
					answer: reply,
				});
				// 将更新后的数据写入文件
				fs.writeFileSync(
					"./data.json",
					JSON.stringify(AnsData, null, 4),
					"utf8"
				);
				console.log(
					"-------------------------问题答案是：-------------------------------\n"
				);
				console.log(reply);
				console.log(
					"--------------------------------------------------------\n"
				);
			}
			if (answer.toLowerCase() === "u") {
				currentQuestionIndex -= 2;
				askQuestionList();
				return;
			}
			currentQuestionIndex++;
			askQuestionList();
		} else {
			console.log("Thank you for your answers!");
			process.exit(0);
		}
	}
	askQuestionList();
}
console.log("! ---kif的刷题脚本--- !\n");

console.log("! 题目数据来源：面试鸭 !\n");
console.log("! 答案数据来源：文心一言 !\n");
console.log("! 感谢面试鸭、文心一言提供的强大支持！ !\n");
console.log("! 个人使用，请勿商用！ !\n");
main();
