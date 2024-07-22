//Load ENV data
const apiKey = process.env.GEMINIKEY;
const allowOrigin = process.env.ALLOWORIGIN;

//Load modules
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fs = require('fs');

//Create AI variables
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

//Init server
exports.kiai = onRequest(async  (req, res) => {
	
	//Set variables
	const origin = req.get('origin');
	data = JSON.parse(req.body);
	logger.info({"Status":"Kiai in action!","Origin":origin,"JSON":data}, {structuredData: true});
	
	//Create prompt and get AI result
	let message = `Use templates and create a content to page ${data.kiaiTitle}, ${data.kiaiDescription}.\nReturn only a JSON variable.`;
	let code = await run(message);
	data.kiaiHash = hash(data.kiaiTitle)
	
	logger.info(code, {structuredData: true});
	
	let json = JSON.parse(code.replace("```json",'').replace("```",''));
	
	//Create HTML and JS to deploy if localhost
	if( origin.indexOf('127.0.0.1') > -1 || origin.indexOf('localhost') > -1 ){
		fs.writeFile(`../public/debug/${data.kiaiHash}.html`, json.html, err => {
			if (err) throw err;
			logger.info({"html":`${data.kiaiHash}.html has created!`}, {structuredData: true});
		});			
		let js = "//"+data.title;
		fs.writeFile(`../public/debug/${data.kiaiHash}.js`, json.javascript, err => {
			if (err) throw err;			
			logger.info({"js":`${data.kiaiHash}.html has created!`}, {structuredData: true});
		});
	}

	//Send result to webpow
	res.set('Access-Control-Allow-Origin', allowOrigin);
	res.set('Content-Type', 'application/json; charset=UTF-8');
	res.send('{"title":"'+data.kiaiTitle+'","hash":"'+data.kiaiHash+'"}');
	res.end();
	
});

//Init Gemini API
async function run(message) {
	const chatSession = model.startChat({
		generationConfig,
		history: [
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
    ],
	});
	const result = await chatSession.sendMessage(message);
	return result.response.text();
}

//normalize data
function normalize(data){
	return data.replace(/\r\n/g,"\\\\n").replace(/\t/g,"\\\\t");
}

//hash
function hash(word){
	return word.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/[^\w\s]/gi,``).replace(/\s/g,`-`).replace(/--/g,`-`).toLowerCase();
}