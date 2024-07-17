//Gemini API key
const apiKey = "AIzaSyBYuYOtDj4Yqj66gR6Kqabups4TQ4TzIxo";

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fs = require('fs');

const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
});
const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: "text/plain",
};

//request
exports.kiai = onRequest(async  (req, res) => {
	logger.info("Kiai in action!", {structuredData: true});
	data = JSON.parse(req.body);	
	let message = `Use templates and create a content to page ${data.title}, ${data.description}.\nReturn only a JSON variable.`;
	let code = await run(message);
	data.hash = hash(data.title)
	let json = JSON.parse(code.replace("```json",'').replace("```",''));
	
	//only local host
	fs.writeFile(`../public/debug/${data.hash}.html`, json.html, function (err) {
		if (err) throw err;
		console.log(`${data.hash}.html has created!`);
	});			
	let js = "//"+data.title;
	fs.writeFile(`../public/debug/${data.hash}.js`, json.javascript, function (err) {
		if (err) throw err;
		console.log(`${data.hash}.js has created!`);
	});
	
	
	res.set('Access-Control-Allow-Origin', '*');
	res.send('{"title":"'+data.title+'","hash":"'+data.hash+'"}');
	res.end();
});

//gemini
async function run(message) {
	const chatSession = model.startChat({
		generationConfig,
		history: stories[0],
	});
	const result = await chatSession.sendMessage(message);
	return result.response.text();
}

const stories = new Array();
stories[0] = [
      {
        role: "user",
        parts: [
          {text: fs.readFileSync('template\\prompt.txt', 'utf8')+"\n```html\n"+fs.readFileSync('template\\template.html', 'utf8')+"\n```\n\n```JavaScript\n"+fs.readFileSync('template\\template.html', 'utf8')+"\n```"},
		   {text: "Test. Create a full test with all sections."},
        ],
      },{
        role: "model",
        parts: [
          {text: "```json\\n{\\\"html\\\": \\\""+normalize(fs.readFileSync('template\\test.html', 'utf8'))+"\\\", \\\"javascript\\\": \\\""+normalize(fs.readFileSync('template\\test.js', 'utf8'))+"\\\"}\\n```"},
        ],
      },
    ];

//normalize data
function normalize(data){
	return data.replace(/\r\n/g,"\\\\n").replace(/\t/g,"\\\\t");
}

//hash
function hash(word){
	return word.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/[^\w\s]/gi,``).replace(/\s/g,`-`).replace(/--/g,`-`).toLowerCase();
}