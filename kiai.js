var http = require('http');
var fs = require('fs');

const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyBYuYOtDj4Yqj66gR6Kqabups4TQ4TzIxo";
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

const origin = "http://localhost:5000";
const methods = "HEAD, GET, POST, OPTIONS";
const listen = 3000;

http.createServer(async (req,res)=>{			
	if(req.method=='OPTIONS'){
		res.writeHead(202, {
			'X-XSS-Protection': '0',
			'X-Content-Type-Options': 'nosniff',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': methods,
			'Access-Control-Allow-Headers': 'X-Csrf-Token, Content-Type',
			'X-Csrf-Token' : Array.from(new Uint8Array(crypto.getRandomValues(new Uint8Array(16)))).map(b=>b.toString(16).padStart(2,'0')).join(''),
			'Access-Control-Max-Age': '30',
			'Keep-Alive': 'timeout=2, max=10',
			'Connection': 'Keep-Alive'
		});
		res.end();
	} else {
		let data = {};
		await req.on('data', json => data = JSON.parse(json));
		if(data){				
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=UTF-8',
				'X-XSS-Protection': '1',
				'X-Content-Type-Options': 'nosniff',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': methods,
				'Access-Control-Allow-Credentials' : 'true'
			});
			let message = `Utilize a classe w3.css e crie um conteudo para a página para ${data.title}, ${data.description}.\nRetorne apenas o código fonte.`;
			let code = await run(message);
			
			//console.log(code);
			
			let json = JSON.parse(code.replace("```json",'').replace("```",''));
			
		//	console.log(json);
			
		
			
			fs.writeFile(`public/debug/${data.hash}.html`, json.html, function (err) {
				if (err) throw err;
				console.log(`${data.hash}.html has created!`);
			});
			
			let js = "//"+data.title;
			fs.writeFile(`public/debug/${data.hash}.js`, json.javascript, function (err) {
				if (err) throw err;
				console.log(`${data.hash}.js has created!`);
			});
			
			res.write('{"title":"'+data.title+'","hash":"'+data.hash+'"}');
		}else{
			res.writeHead(404, {
				'Content-Type': 'application/json; charset=UTF-8',
				'X-XSS-Protection': '1',
				'X-Content-Type-Options': 'nosniff',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET'
			});
		}
		res.end();
	}			
}).listen(listen);


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
          {text: "You must only create content to be used within a website that will be used within the \"main\" tag, separating the sections semantically and according to the information sent by the client and always suggesting different designers, images and texts. Return only the HTML source code using the w3.css class for formatting and creating cards and sessions in the content.\n\nFollow the rules below when creating content:\nYou should not write the \"main\" tag.\nVary the number and position of sessions and cards.\nPut images of w3schools with example.\nSessions must be divided by a section tag.\nAways return only a JSON variable with html and javascript as  {\"html\": \"sourcehtml\",\"javascript\":\"\"//Title page\"}\n\nThe example below is just a template and can be changed according to the desired content:\n\nChristmas, Make a page about Christmas that has a white background and uses red for the titles.\n"},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "```json\n{\"html\": \"<section class=\\\"w3-container w3-white w3-center w3-padding-64\\\">\\r\\n  <h1 class=\\\"w3-text-red\\\">Christmas Spirit</h1>\\r\\n  <p class=\\\"w3-large\\\">Celebrate the magic of Christmas with festive traditions, heartwarming stories, and joyful decorations. </p>\\r\\n  <div class=\\\"w3-row-padding w3-margin-top\\\">\\r\\n    <div class=\\\"w3-third\\\">\\r\\n      <div class=\\\"w3-card-4 w3-margin\\\">\\r\\n        <img src=\\\"https://www.w3schools.com/w3css/img_lights.jpg\\\" alt=\\\"Lights\\\" style=\\\"width:100%\\\" class=\\\"w3-hover-opacity\\\">\\r\\n        <div class=\\\"w3-container w3-center\\\">\\r\\n          <h3>Christmas Lights</h3>\\r\\n          <p>Brighten up your home with twinkling lights and create a festive ambiance.</p>\\r\\n          <button class=\\\"w3-button w3-red\\\">Learn More</button>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n    <div class=\\\"w3-third\\\">\\r\\n      <div class=\\\"w3-card-4 w3-margin\\\">\\r\\n        <img src=\\\"https://www.w3schools.com/w3css/img_snow.jpg\\\" alt=\\\"Snow\\\" style=\\\"width:100%\\\" class=\\\"w3-hover-opacity\\\">\\r\\n        <div class=\\\"w3-container w3-center\\\">\\r\\n          <h3>Winter Wonderland</h3>\\r\\n          <p>Embrace the snowy season and enjoy winter activities like ice skating and snowmen building.</p>\\r\\n          <button class=\\\"w3-button w3-red\\\">Discover More</button>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n    <div class=\\\"w3-third\\\">\\r\\n      <div class=\\\"w3-card-4 w3-margin\\\">\\r\\n        <img src=\\\"https://www.w3schools.com/w3css/img_forest.jpg\\\" alt=\\\"Christmas Tree\\\" style=\\\"width:100%\\\" class=\\\"w3-hover-opacity\\\">\\r\\n        <div class=\\\"w3-container w3-center\\\">\\r\\n          <h3>Christmas Tree</h3>\\r\\n          <p>Decorate your Christmas tree with ornaments, lights, and a star on top.</p>\\r\\n          <button class=\\\"w3-button w3-red\\\">Explore Decorations</button>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n  </div>\\r\\n</section>\\r\\n<section class=\\\"w3-container w3-white w3-center w3-padding-64\\\">\\r\\n  <h1 class=\\\"w3-text-red\\\">Christmas Traditions</h1>\\r\\n  <p class=\\\"w3-large\\\">Discover the rich history and traditions that make Christmas so special.</p>\\r\\n  <div class=\\\"w3-row-padding w3-margin-top\\\">\\r\\n    <div class=\\\"w3-half\\\">\\r\\n      <div class=\\\"w3-card-4 w3-margin\\\">\\r\\n        <img src=\\\"https://www.w3schools.com/w3css/img_snow.jpg\\\" alt=\\\"Snow\\\" style=\\\"width:100%\\\" class=\\\"w3-hover-opacity\\\">\\r\\n        <div class=\\\"w3-container w3-center\\\">\\r\\n          <h3>Santa Claus</h3>\\r\\n          <p>Learn about the jolly figure who brings gifts to children on Christmas Eve.</p>\\r\\n          <button class=\\\"w3-button w3-red\\\">Read More</button>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n    <div class=\\\"w3-half\\\">\\r\\n      <div class=\\\"w3-card-4 w3-margin\\\">\\r\\n        <img src=\\\"https://www.w3schools.com/w3css/img_lights.jpg\\\" alt=\\\"Lights\\\" style=\\\"width:100%\\\" class=\\\"w3-hover-opacity\\\">\\r\\n        <div class=\\\"w3-container w3-center\\\">\\r\\n          <h3>Christmas Carols</h3>\\r\\n          <p>Explore the timeless melodies and lyrics of traditional Christmas songs.</p>\\r\\n          <button class=\\\"w3-button w3-red\\\">Listen Now</button>\\r\\n        </div>\\r\\n      </div>\\r\\n    </div>\\r\\n  </div>\\r\\n</section>\", \"javascript\": \"//Christmas\"}\n```"},
        ],
      },
    ];
