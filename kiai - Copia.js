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
			
			let html = code;
			fs.writeFile(`public/debug/${data.hash}.html`, html, function (err) {
				if (err) throw err;
				console.log(`${data.hash}.html has created!`);
			});
			
			let js = "//"+data.title;
			fs.writeFile(`public/debug/${data.hash}.js`, js, function (err) {
				if (err) throw err;
				console.log(`${data.hash}.js has created!`);
			});
			
			res.write('{"title":"'+data.title+'","hash":"'+data.hash+'","code" : '+JSON.stringify(code)+'}');
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
          {text: "Crie apenas o conteúdo para ser utilizado dentro de uma página na internet que será utilizado dentro da tag \"main\" separando as sessões de forma semantica e de acordo com as informações enviadas pelo cliente e sugerindo sempre designers diferenciados, imagens e textos. Retorne apenas o código fonte do HTML utilizando a classe w3css para a formatação e criação de cards e sessões no conteúdo.\nSiga as regras abaixo na hora de criar o conteudo:\n1. Você não deve escrever a tag \"main\".\n2. Escreva apenas o código fonte em HTML.\n3. Varie o número e posição de sessões e cards.\n\nO exemplo abaixo é apenas um modelo e pode ser alterado de acordo com o conteúdo desejado:\n\nFesta de São João\n\n<section class=\"w3-container w3-padding-64\">\n  <h1 class=\"w3-center w3-text-teal w3-jumbo\">Festa Junina: Tradição e Alegria!</h1>\n  <p class=\"w3-center w3-large\">Celebrando o mês de junho com um arraiá cheio de charme e sabor!</p>\n\n<article class=\"w3-container w3-card w3-light-gray w3-round\">\n  <h2 class=\"w3-text-blue\">Arraial de São João: Celebrando a Tradição em Grande Estilo!</h2>\n\n  <div class=\"w3-container w3-padding\">\n    <p>Prepare-se para a festa mais animada do ano! O tradicional Arraial de São João está de volta, prometendo muita alegria, música, dança e comidas típicas.</p>\n\n    <p>Em um ambiente decorado com bandeirinhas, fogueiras e barracas, você poderá se divertir com diversas atrações, como quadrilhas, shows ao vivo, brincadeiras juninas e muito mais.</p>\n\n    <p>Para completar a experiência, não deixe de provar os deliciosos quitutes típicos, como canjica, pamonha, bolo de milho e cuscuz. E para brindar a essa noite especial, nada melhor que um bom quentão.</p>\n  </div>\n\n  <div class=\"w3-container w3-center w3-padding\">\n    <a href=\"#\" class=\"w3-button w3-blue w3-round\">Venha se divertir no Arraial de São João!</a>\n  </div>\n</article>\n\n  <div class=\"w3-row-padding w3-padding-16 w3-center\" style=\"margin-top:32px;\">\n    <div class=\"w3-quarter w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_lights.jpg\" alt=\"Fogueira\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>A Chama da Tradição</h3>\n        <p>A fogueira, símbolo da festa junina, representa a luz que guia nossos caminhos e a força que nos une.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_mountains.jpg\" alt=\"Comida Típica\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Sabores Inesquecíveis</h3>\n        <p>Delícias como canjica, pamonha, milho verde e bolo de fubá aquecem o corpo e a alma.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_forest.jpg\" alt=\"Música e Dança\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>A Música que Contagia</h3>\n        <p>Quadrilha, forró e músicas tradicionais animam a festa, contagiando a todos com alegria.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_snow.jpg\" alt=\"Fantasias\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>A Magia das Fantasias</h3>\n        <p>Vestir-se a caráter, com chapéu de palha, vestido de chita e outros adereços, torna a festa ainda mais especial.</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class=\"w3-center w3-text-teal w3-padding-32\">Nossas Atrações</h2>\n\n  <div class=\"w3-row-padding w3-padding-16\" style=\"margin-top:32px;\">\n    <div class=\"w3-half w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_lights.jpg\" alt=\"Música ao Vivo\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Música ao Vivo</h3>\n        <p>Prepare-se para dançar ao som de grupos musicais que farão a festa vibrar!</p>\n        <p>Data: [Data do evento]</p>\n        <p>Horário: [Horário do evento]</p>\n      </div>\n    </div>\n    <div class=\"w3-half w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_mountains.jpg\" alt=\"Quadrilha\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Quadrilha Tradicional</h3>\n        <p>Uma apresentação emocionante que revive a tradição da dança junina, com coreografias e figurinos impecáveis!</p>\n        <p>Data: [Data do evento]</p>\n        <p>Horário: [Horário do evento]</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class=\"w3-center w3-text-teal w3-padding-32\">Delícias Juninas</h2>\n\n  <div class=\"w3-row-padding w3-padding-16\" style=\"margin-top:32px;\">\n    <div class=\"w3-third w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_forest.jpg\" alt=\"Comida Típica\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Cardápio Delicioso</h3>\n        <p>Saboreie os quitutes tradicionais da festa junina: pamonha, canjica, bolo de milho, pé de moleque e muito mais!</p>\n      </div>\n    </div>\n    <div class=\"w3-third w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_snow.jpg\" alt=\"Bebidas\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Bebidas Refrescantes</h3>\n        <p>Sucos de fruta, quentão, vinho quente e outras bebidas para saciar a sede e animar a festa.</p>\n      </div>\n    </div>\n    <div class=\"w3-third w3-section w3-card-4\">\n      <img src=\"https://www.w3schools.com/w3css/img_lights.jpg\" alt=\"Doçuras\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Doçuras Irresistíveis</h3>\n        <p>Doces de abóbora, cocada, paçoca e outras delícias para adoçar a sua festa junina.</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class=\"w3-center w3-text-teal w3-padding-32\">Informações Importantes</h2>\n\n  <div class=\"w3-row-padding w3-padding-16\" style=\"margin-top:32px;\">\n    <div class=\"w3-half w3-section w3-card-4\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Local</h3>\n        <p>[Local da festa]</p>\n        <p>[Endereço completo]</p>\n      </div>\n    </div>\n    <div class=\"w3-half w3-section w3-card-4\">\n      <div class=\"w3-container w3-padding\">\n        <h3>Data e Horário</h3>\n        <p>[Data do evento]</p>\n        <p>[Horário do evento]</p>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"w3-center w3-padding-32\">\n    <button class=\"w3-button w3-teal w3-padding-large w3-round-large\">Saiba Mais</button>\n  </div>\n</section>"},
          {text: "Uma página institucional sobre a Escola de Tatuagens \"Fura tudo\" utilizando a cor vermelha com predominância, criando sombras e efeitos de degrade para a cor deep-purple da classe w3css."},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "<section class=\"w3-container w3-padding-64 w3-red\">\n  <h1 class=\"w3-center w3-text-white w3-jumbo\">Fura Tudo: A Arte de Tatuar na Pele!</h1>\n  <p class=\"w3-center w3-large w3-text-white\">Aonde o estilo encontra a tinta, e a arte se torna eterna.</p>\n\n  <article class=\"w3-container w3-card w3-light-gray w3-round w3-margin-top\">\n    <h2 class=\"w3-text-deep-purple\">Bem-vindos à Fura Tudo!</h2>\n\n    <div class=\"w3-container w3-padding\">\n      <p>A Fura Tudo é mais do que uma simples escola de tatuagem. Somos um espaço dedicado à arte, à expressão individual e à paixão pela tinta.</p>\n\n      <p>Com uma equipe de tatuadores experientes e talentosos, oferecemos uma variedade de estilos, desde o tradicional até o moderno, para que você encontre a tatuagem perfeita para seu estilo.</p>\n\n      <p>Acreditamos que cada tatuagem é única, assim como cada pessoa. Por isso, trabalhamos em conjunto com nossos clientes para criar peças personalizadas e significativas, que contarão suas histórias através da pele.</p>\n    </div>\n\n    <div class=\"w3-container w3-center w3-padding\">\n      <a href=\"#\" class=\"w3-button w3-deep-purple w3-round\">Conecte-se com a Arte!</a>\n    </div>\n  </article>\n\n  <div class=\"w3-row-padding w3-padding-16 w3-center\" style=\"margin-top:32px;\">\n    <div class=\"w3-quarter w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_lights.jpg\" alt=\"Tatuador\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Artistas Experientes</h3>\n        <p>Profissionais qualificados e apaixonados por sua arte, com domínio de diversas técnicas.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_mountains.jpg\" alt=\"Estúdio\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Ambiente Seguro e Confortável</h3>\n        <p>Um espaço moderno e equipado, com higiene impecável para sua segurança e tranquilidade.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_forest.jpg\" alt=\"Tatuagens\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Diversos Estilos</h3>\n        <p>Encontre a tatuagem perfeita para você, desde o tradicional até o moderno, com criatividade e qualidade.</p>\n      </div>\n    </div>\n    <div class=\"w3-quarter w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_snow.jpg\" alt=\"Materiais\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Materiais de Primeira</h3>\n        <p>Utilizamos materiais descartáveis e de alta qualidade, garantindo segurança e resultados impecáveis.</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class=\"w3-center w3-text-white w3-padding-32\">Nossas Especialidades</h2>\n\n  <div class=\"w3-row-padding w3-padding-16\" style=\"margin-top:32px;\">\n    <div class=\"w3-half w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_lights.jpg\" alt=\"Tatuagem Tradicional\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Tradicional</h3>\n        <p>Linhas fortes, cores vibrantes e temas clássicos, como rosas, caveiras e âncoras.</p>\n      </div>\n    </div>\n    <div class=\"w3-half w3-section w3-card-4 w3-hover-shadow-lg\">\n      <img src=\"https://www.w3schools.com/w3css/img_mountains.jpg\" alt=\"Tatuagem Realista\" class=\"w3-image w3-round-large\" style=\"width:100%\">\n      <div class=\"w3-container w3-padding w3-text-white\">\n        <h3>Realismo</h3>\n        <p>Detalhes precisos e realismo impressionante, capturando a beleza do mundo em sua pele.</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class=\"w3-center w3-text-white w3-padding-32\">Sua Jornada Começa Aqui!</h2>\n\n  <div class=\"w3-center w3-padding-32\">\n    <a href=\"#\" class=\"w3-button w3-deep-purple w3-padding-large w3-round-large\">Agendar Consulta</a>\n  </div>\n</section>"},
        ],
      },
    ];
