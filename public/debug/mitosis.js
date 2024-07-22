clone.name = 'WebpoW';
clone.zip = new Array();
clone.file = new Array();
clone.dec2bin=(dec,size)=>dec.toString(2).padStart(size,'0');
clone.dec2str=dec=>new TextDecoder().decode(new Uint8Array(dec));
clone.str2dec=str=>Array.from(new TextEncoder().encode(str));
clone.str2hex=str=>[...new TextEncoder().encode(str)].map(x=>x.toString(16).padStart(2,'0'));
clone.hex2buf=hex=>new Uint8Array(hex.split(' ').map(x=>parseInt(x,16)));
clone.bin2dec=bin=>bin.map(x=>parseInt(x,2));
clone.bin2hex=bin=>(parseInt(bin.slice(8),2).toString(16).padStart(2,'0')+' '+parseInt(bin.slice(0,8),2).toString(16).padStart(2,'0'));
clone.reverse=hex=>{
	let hexArray=new Array();
	for(let i=0;i<hex.length;i=i+2)hexArray[i]=hex[i]+''+hex[i+1];
	return hexArray.filter((a)=>a).reverse().join(' ');	
}

clone.crc32=r=>{
	for(var a,o=[],c=0;c<256;c++){
		a=c;
		for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;
		o[c]=a;
	}
	for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r[t])];
	return clone.reverse(((-1^n)>>>0).toString(16).padStart(8,'0'));
}

clone.fecth2zip=(filesArray,folder='')=>{
	filesArray.forEach(fileUrl=>{
		let resp;
		fetch(fileUrl).then(response=>{
			resp=response;
			return response.arrayBuffer();
		}).then(blob=>{
			new Response(blob).arrayBuffer().then(buffer=>{
				let uint=[...new Uint8Array(buffer)];
				uint.modTime=resp.headers.get('Last-Modified');
				uint.fileUrl=`${folder}${fileUrl}`;
				clone.zip[fileUrl]=uint;
			});
		});
	});
}

clone.str2zip=(name,str,folder='')=>{
	let uint=[...new Uint8Array(clone.str2dec(str))];
	uint.modTime=new Date();
	uint.fileUrl=`${folder}${name}`;
	clone.zip[name]=uint;
}

clone.makeZip=()=>{
	let count=0;
	let fileHeader='';
	let centralDirectoryFileHeader='';
	let directoryInit=0;
	let offSetLocalHeader='00 00 00 00';
	let zip=clone.zip;
	for(const name in zip){
		let modTime=()=>{
			lastMod=new Date(zip[name].modTime);
			hour=clone.dec2bin(lastMod.getHours(),5);
			minutes=clone.dec2bin(lastMod.getMinutes(),6);
			seconds=clone.dec2bin(Math.round(lastMod.getSeconds()/2),5);
			year=clone.dec2bin(lastMod.getFullYear()-1980,7);
			month=clone.dec2bin(lastMod.getMonth()+1,4);
			day=clone.dec2bin(lastMod.getDate(),5);
			return clone.bin2hex(`${hour}${minutes}${seconds}`)+' '+clone.bin2hex(`${year}${month}${day}`);
		}
		let crc=clone.crc32(zip[name]);
		let size=clone.reverse(parseInt(zip[name].length).toString(16).padStart(8,'0'));
		let nameFile=clone.str2hex(zip[name].fileUrl).join(' ');
		let nameSize=clone.reverse(zip[name].fileUrl.length.toString(16).padStart(4,'0'));
		let fileHeader=`50 4B 03 04 14 00 00 00 00 00 ${modTime} ${crc} ${size} ${size} ${nameSize} 00 00 ${nameFile}`;
		let fileHeaderBuffer=clone.hex2buf(fileHeader);
		directoryInit=directoryInit+fileHeaderBuffer.length+zip[name].length;
		centralDirectoryFileHeader=`${centralDirectoryFileHeader}50 4B 01 02 14 00 14 00 00 00 00 00 ${modTime} ${crc} ${size} ${size} ${nameSize} 00 00 00 00 00 00 01 00 20 00 00 00 ${offSetLocalHeader} ${nameFile} `;
		offSetLocalHeader=clone.reverse(directoryInit.toString(16).padStart(8,'0'));
		clone.file.push(fileHeaderBuffer,new Uint8Array(zip[name]));
		count++;
	}
	centralDirectoryFileHeader=centralDirectoryFileHeader.trim();
	let entries=clone.reverse(count.toString(16).padStart(4,'0'));
	let dirSize=clone.reverse(centralDirectoryFileHeader.split(' ').length.toString(16).padStart(8,'0'));
	let dirInit=clone.reverse(directoryInit.toString(16).padStart(8,'0'));
	let centralDirectory=`50 4b 05 06 00 00 00 00 ${entries} ${entries} ${dirSize} ${dirInit} 00 00`;
	clone.file.push(clone.hex2buf(centralDirectoryFileHeader),clone.hex2buf(centralDirectory));
	let a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([...clone.file],{type:'application/octet-stream'}));
	a.download = `${clone.name}.zip`;
	a.click();
}

clone.firebase={
	"firestore":{
		"rules":"firestore.rules","indexes":"firestore.indexes.json"
	},
	"hosting":{
		"public":"public",
		"headers":[
			{
				"source":"**/*.@(eot|otf|ttf|ttc|woff|font.css)","headers":[
					{
						"key":"Access-Control-Allow-Origin",
						"value":"*"
					}
				]
			},
			{
				"source":"**/*.@(js|css)",
				"headers":[
					{
						"key":"Cache-Control",
						"value":"max-age=604800"
					}
				]
			},
			{
				"source":"**/*.@(jpg|jpeg|gif|png|webp)",
				"headers":[
					{
						"key":"Cache-Control",
						"value":"max-age=604800"
					}
				]
			},
			{
				"source":"404.html",
				"headers":[
					{
						"key":"Cache-Control",
						"value":"max-age=300"
					}
				]
			}
		],
		"ignore":[
			"firebase.json",
			"**/.*",
			"**/node_modules/**"
		]
	},
	"functions": [
		{
			"source": "functions",
			"codebase": "default",
			"ignore": [
				"node_modules",
				".git",
				"firebase-debug.log",
				"firebase-debug.*.log",
				"*.local"
			]
		}
	],
	"emulators": {
		"functions": {
			"port": 5001
			},
		"firestore": {
			"port": 8001
		},
		"hosting": {
			"port": 5000
		},
		"ui": {
			"enabled": true,
		"port": 4000
		},
		"singleProjectMode": true,
		"auth": {
			"port": 9099
		}
	}
};

clone.indexes={"indexes":[{"collectionGroup":"apps","queryScope":"COLLECTION","fields":[{"fieldPath":"credential.menu","arrayConfig":"CONTAINS"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"apps","queryScope":"COLLECTION","fields":[{"fieldPath":"credential.read","arrayConfig":"CONTAINS"},{"fieldPath":"dad","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"groups","queryScope":"COLLECTION","fields":[{"fieldPath":"boss","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"groups","queryScope":"COLLECTION","fields":[{"fieldPath":"id","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"deleted","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"group","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]}],"fieldOverrides":[]};

clone.rules=`rules_version='2';\r\n\tservice cloud.firestore {\r\n\tmatch /databases/{database}/documents {\r\n\t\tmatch /apps/{docId} {\r\n\t\t\tallow list: if '<!--common-->' in resource.data.credential.read || '<!--common-->' in resource.data.credential.menu || request.auth.token.name == '<!--super-user-->' || request.auth.token.name in resource.data.credential.menu;\r\n\t\t\tallow get,read: if '<!--common-->' in resource.data.credential.read || request.auth.token.name in resource.data.credential.read || request.auth.token.name == '<!--super-user-->';\r\n\t\t\tallow write: if request.auth.token.name in resource.data.credential.write || request.auth.token.name == '<!--super-user-->' || '<!--common-->' in resource.data.credential.write;\r\n\t\t}\r\n\t\tmatch /users/{userId} {\r\n\t\t\tallow create,get,update,delete: if request.auth.uid == userId;\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t\t\tmatch /groups/{grupoId} {\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t\t\tmatch /model/{grupoId} {\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t}\r\n}`;

clone.firebaserc=`{\r\n\t"projects":{\r\n\t\t"default":"<!--projectId-->"\r\n\t}\r\n}`;

clone.db={
	"apps": {
		"admin": {
			"name": "Admin",
			"module": "none",
			"html": "<article class='w3-container' id='admin'>\n\t<fieldset class='w3-card w3-round w3-border-<!--theme-color-->'>\n\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding'><!--project-name--></legend>\n\t\t<nav class='w3-center' id='adminList'></nav>\n\t\t<br>\n\t</fieldset>\n</article>",
			"dad": "root",
			"javascript": "admin.list=()=>{\n\t$(`#adminList`).innerHTML=`<p class='w3-center'><img src='load.gif' alt='loading' width='50'></p>`;\n\tread(`apps`,`credential.read;array-contains;${user.displayName}|dad;==;admin`,`hash`).then(data=>{\n\t\t$('#adminList').innerHTML='';\n\t\tfor(const id in data)$(`#adminList`).insertAdjacentHTML(`beforeend`,`<a href='#${data[id].hash}' class='w3-btn w3-<!--theme-color--> w3-large w3-round w3-margin-top' style='width:50%'>${data[id].name}</a><br>`);\n\t});\n}\nadmin.list();",
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->"
				],
				"menu": [
					"<!--super-user-->"
				]
			},
			"hash": "admin"
		},
		"apps": {
			"name": "Apps",
			"html": "<article class='w3-container' id='app'>\n\t<h3 class='w3-container'>\n\t\tApps <span class='w3-small' id='appFolder'></span>\n\t</h3>\n\t\n\t<!--List-->\n\t<table class='w3-table-all w3-hoverable w3-card'>\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t<th>Name</th>\n\t\t\t\t<th class='w3-w'>Hash</th>\n\t\t\t\t<th class='w3-right'>\n\t\t\t\t\t<button class='w3-btn w3-deep-orange w3-right w3-tiny w3-round w3-e' id='appFilterBtn'>\n\t\t\t\t\t\t<span class='w3-w'>Filter</span>\n\t\t\t\t\t\t<span class='w3-y'>F</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='appNewBtn'>\n\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t</button>\n\t\t\t\t</th>\n\t\t\t</tr><tr>\n\t\t\t\t<td class='w3-padding-0' colspan='3'>\n\t\t\t\t\t<span class='w3-hide w3-center w3-animate-opacity' id='appFilter'>\n\t\t\t\t\t\t<input class='w3-input' id='appFilterName' placeholder='&#9655; Name &#9665;' type='text'>\n\t\t\t\t\t</span>\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody id='appList'>\n\t\t</tbody>\n\t</table>\n\t\n\t<!--Edit-->\n\t<div class='w3-modal w3-animate-opacity' id='appEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='appEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='appEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-blue'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-blue w3-padding'>Arquivo <span class='w3-small w3-text-green' id='appEditLabel'>#</span></legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Dad</label>\n\t\t\t\t\t\t<select class='w3-select' id='appEditDad' name='appEditDad' required></select>\n\t\t\t\t\t\t<span id='modules'>\n\t\t\t\t\t\t\t<label class='w3-text-blue'>Module</label>\n\t\t\t\t\t\t\t<select class='w3-select' id='appEditModule' name='appEditModule' required>\n\t\t\t\t\t\t\t\t<option value='none'>None\n\t\t\t\t\t\t\t\t<option value='header'>Header\n\t\t\t\t\t\t\t\t<option value='footer'>Footer\n\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t</span>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' id='appEditName' name='appEditName' placeholder='nome' type='text' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>HTML</label>\n\t\t\t\t\t\t<textarea class='w3-input w3-tiny' id='appEditHTML' name='appEditHTML' placeholder='HTML'></textarea>\n\t\t\t\t\t\t<label class='w3-text-blue'>Script</label>\n\t\t\t\t\t\t<textarea class='w3-input w3-tiny' id='appEditJavascript' name='appEditJavascript' placeholder='JavaScript'></textarea>\n\t\t\t\t\t\t<div style='height:5px'></div>\n\t\t\t\t\t\t<label class='w3-text-blue'>\n\t\t\t\t\t\t\tCredentials\n\t\t\t\t\t\t\t<button type='button' class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='appCredentialNew'>\n\t\t\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t</label>\n\t\t\t\t\t\t<br>\n\t\t\t\t\t\t<div style='height:80px;overflow-y:scroll'>\n\t\t\t\t\t\t\t<table class='w3-table-all w3-hoverable'>\n\t\t\t\t\t\t\t\t<tbody id='appCredentialsList'>\n\t\t\t\t\t\t\t\t</tbody>\n\t\t\t\t\t\t\t</table>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='appEditBtn'>\n\t\t\t\t\t\t\t<button type='button' class='w3-btn w3-red w3-round' id='appEditCancel'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='appEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='appEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' alt='Load' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\n\t<!--credentials-->\n\t<div class='w3-modal w3-animate-opacity' id='appCredentialEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='appCredentialEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='appCredentialEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-blue'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-blue w3-padding'>Credential <span class='w3-small w3-text-green' id='appCredentialEditName'></span></legend>\n\t\t\t\t\t\t<div id='appGroupFind'>\n\t\t\t\t\t\t\t<label class='w3-text-blue'>Group</label>\n\t\t\t\t\t\t\t<input type='text' class='w3-input' id='appCredentialEditGroupFilter' placeholder='Search group'>\n\t\t\t\t\t\t\t<span class='w3-hide w3-dropdown-content w3-bar-block w3-border' id='appGroupFilterList'></span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<label class='w3-text-blue'>Read</label>\n\t\t\t\t\t\t<select class='w3-input' id='appCredentialEditRead' name='appCredentialEditRead'>\n\t\t\t\t\t\t\t<option value='0'>No\n\t\t\t\t\t\t\t<option value='1'>Yes\n\t\t\t\t\t\t</select>\n\t\t\t\t\t\t<label class='w3-text-blue'>Write</label>\n\t\t\t\t\t\t<select class='w3-input' id='appCredentialEditWrite' name='appCredentialEditWrite'>\n\t\t\t\t\t\t\t<option value='0'>No\n\t\t\t\t\t\t\t<option value='1'>Yes\n\t\t\t\t\t\t</select>\n\t\t\t\t\t\t<label class='w3-text-blue'>Menu</label>\n\t\t\t\t\t\t<select class='w3-input' id='appCredentialEditMenu' name='appCredentialEditMenu'>\n\t\t\t\t\t\t\t<option value='0'>No\n\t\t\t\t\t\t\t<option value='1'>Yes\n\t\t\t\t\t\t</select>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='appCredentialEditBtn'>\n\t\t\t\t\t\t\t<button id='appCredentialEditCancel' type='button' class='w3-btn w3-red w3-round'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='appCredentialEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='appCredentialEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' alt='Load' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n\n</article>",
			"hash": "apps",
			"module": "none",
			"dad": "admin",
			"javascript": "app.Groups={};\napp.Apps={};\napp.App={};\napp.Dads=[];\napp.Dads['root']={\"id\":\"root\",\"name\":\"Root\"};\napp.Dad={\"id\":\"root\",\"name\":\"Root\"};\napp.Hash='';\n\napp.filterTime;\n$('#appFilterName').addEventListener('keyup',event=>{\n\tclearTimeout(app.filterTime);\n\tfilterTime=setTimeout(app.List,400,app.Dad);\n});\n$('#appFilterBtn').addEventListener('click',()=>flip('#appFilter'));\n\napp.list=dad=>{\n\tapp.Dad=dad;\n\tlocal=dad.id;\n\tfolder='';\n\twhile(local!=`root`){\n\t\tfolder=local+'/'+folder;\n\t\tlocal=app.Dads[local].id;\n\t}\n\t$('#appFolder').innerHTML='root/'+folder;\n\t$('#appList').innerHTML=\"<tr id='appLoad'><td colspan='3' class='w3-center'><img src='load.gif' alt='loading' width='50'></td></tr>\";\n\tlet filter=`credential.read;array-contains;${user.displayName}|dad;==;${dad.id}`;\n\tfilter+=$('#appFilterName').value!=''?`|hash;>=;${Hash($('#appFilterName').value)}`:'';\n\t//console.log(filter);\n\tread('apps',filter,'hash').then(data=>{\n\t\t$('#appList').innerHTML='';\n\t\tif(data.length>=0){\n\t\t\tapp.Apps=Object.assign(data);\n\t\t\tfor(const id in data){\n\t\t\t\tapp.Dads[id]={'id':data[id].dad,'name':dad.name};\n\t\t\t\t$('#appList').insertAdjacentHTML('beforeend',`<tr>\n\t\t\t\t\t<td class='w3-point' id='appFolder${id}'>${data[id].name}</td>\n\t\t\t\t\t<td class='w3-w'>${id}</td>\n\t\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='appEdit${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='appDelete${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>`);\n\t\t\t\t$(\"#appFolder\"+id).addEventListener('click',()=>app.list({\"id\":id,\"name\":data[id].name}));\n\t\t\t\t$(\"#appEdit\"+id).addEventListener('click',()=>{\n\t\t\t\t\tapp.Hash=id;\n\t\t\t\t\tapp.App=Object.assign({},app.Apps[id]);\n\t\t\t\t\tapp.folder(id);\n\t\t\t\t\tapp.App.dad=='modules'?show('#modules'):hide('#modules');\n\t\t\t\t\t$('#appEditData').reset();\n\t\t\t\t\t$('#appCredentialsList').innerHTML='';\n\t\t\t\t\t$('#appEditLabel').innerHTML='#'+app.App.hash;\n\t\t\t\t\t$('#appEditDad').value=app.App.dad;\n\t\t\t\t\t$('#appEditModule').value=app.App.module;\n\t\t\t\t\t$('#appEditName').value=app.App.name;\n\t\t\t\t\t$('#appEditHTML').value=app.App.html;\n\t\t\t\t\t$('#appEditJavascript').value=app.App.javascript;\n\t\t\t\t\tapp.credentialLoad();\n\t\t\t\t\tshow('#appEdit');\n\t\t\t\t});\n\t\t\t\t$(\"#appDelete\"+id).addEventListener('click',()=>{\n\t\t\t\t\tif(confirm('Do you really want to delete the app?')){\n\t\t\t\t\t\terase('apps/'+id).then(()=>{\n\t\t\t\t\t\t\tapp.list(app.Dad);\n\t\t\t\t\t\t\tmodal('Success','App deleted successfully','green');\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t}\n\t\t\tif(dad.id!='root'){\n\t\t\t\t$('#appList').insertAdjacentHTML('afterbegin',\"<tr><td colspan='3' class='w3-point' id='appAbove'>Above</td></tr>\");\n\t\t\t\t$('#appAbove').addEventListener('click',()=>app.list(app.Dads[dad.id]));\n\t\t\t}\n\t\t}else{\n\t\t\t$('#appList').innerHTML=\"<tr id='appLoad'><td colspan='3' class='w3-center'>Empty</td></tr>\";\n\t\t}\n\t});\n}\napp.list({\"id\":\"root\",\"name\":\"Root\"});\n\n$('#appNewBtn').addEventListener('click',()=>{\n\tapp.Hash='';\n\tapp.folder('root');\t\n\t$('#appEditData').reset();\n\t$('#appEditLabel').innerHTML='';\n\t$('#appCredentialsList').innerHTML='';\n\tapp.App=Object.assign({\t\n\t\t\"credential\":{\"write\":[user.displayName],\"menu\":[user.displayName],\"read\":[user.displayName]},\n\t\t\"dad\":app.Dad.id,\n\t\t\"hash\":\"0\",\n\t\t\"module\":\"none\",\n\t\t\"html\":\"\",\n\t\t\"javascript\":\"\",\n\t\t\"name\":\"\"\n\t});\n\tapp.credentialLoad();\n\tshow('#appEdit');\n});\n\n$('#appEditName').addEventListener('blur',()=>{\n\tname=hash($('#appEditName').value);\n\tif(name!=''){\n\t\tread('apps/'+name).then(data=>{\n\t\t\tif(data&&name!=app.App.hash){\n\t\t\t\tmodal('Caution','The chosen name already exists','yellow');\n\t\t\t}else{\n\t\t\t\t$('#appEditLabel').innerHTML='#'+name;\n\t\t\t}\n\t\t});\n\t}\n});\n\napp.save=data=>{\n\tif(app.App.hash!='0'&&app.Apps[app.App.hash].hash!=hash(data.name))erase('apps/'+app.Apps[app.App.hash].hash);\n\tapp.App.dad=data.dad;\n\tapp.App.name=data.name;\n\tapp.App.hash=hash(data.name);\n\tapp.App.html=data.html;\n\tapp.App.javascript=data.javascript;\n\twrite('apps',app.App,app.App.hash).then(()=>{\n\t\tapp.App=Object.assign({});\n\t\t$('#appEditData').reset();\n\t\thide('#appEdit');\n\t\tapp.list(app.Dad);\n\t\tmodal('Success','Data saved successfully','green');\n\t});\n}\nform('appEdit',app.save);\n\napp.folder=()=>{\n\t$('#appEditDad').innerHTML='';\n\tif(app.Dad.id!='root')$('#appEditDad').innerHTML+=`<option value='${app.Dads[app.Dad.id].id}'>${app.Dads[app.Dad.id].name}`;\n\t$('#appEditDad').innerHTML+=`<option value='${app.Dad.id}' selected>${app.Dad.name}`;\n\tfor(id in app.Apps)if(app.Apps[id].dad==app.Dad.id&&id!=app.Hash)$('#appEditDad').innerHTML+=`<option value='${id}'>${app.Apps[id].name}`;\t\n}\n\n//Credentials\napp.credentialId='0';\napp.credentialLoad=()=>{\n\t$('#appCredentialsList').innerHTML=\"<figure class='w3-center'><img src='load.gif' width='25'></figure>\";\n\tread('groups','id;in;*'+app.credentialIndex(app.App.credential),'hash').then(data=>{\n\t\tapp.Groups=Object.assign(data);\n\t\t$('#appCredentialsList').innerHTML='';\n\t\tfor(const id in data){\n\t\t\t$('#appCredentialsList').insertAdjacentHTML('beforeend',`<tr id='appCredential${id}'>\n\t\t\t\t<td>${data[id].name}</td>\n\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t<button type='button' class='w3-btn w3-tiny w3-round w3-blue w3-e' id='appCredentialEdit${id}'>\n\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button type='button' class='w3-btn w3-tiny w3-round w3-red w3-e' id='appCredentialDelete${id}'>\n\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t</button>\n\t\t\t\t</td>\n\t\t\t</tr>`);\n\t\t\t$(\"#appCredentialEdit\"+id).addEventListener('click',event=>{\n\t\t\t\tapp.credentialId=id;\n\t\t\t\t$('#appCredentialEditName').innerHTML=app.Groups[id].name;\n\t\t\t\t$('#appCredentialEditRead').value=app.App.credential.read.includes(id)?'1':'0';\n\t\t\t\t$('#appCredentialEditWrite').value=app.App.credential.write.includes(id)?'1':'0';\n\t\t\t\t$('#appCredentialEditMenu').value=app.App.credential.menu.includes(id)?'1':'0';\n\t\t\t\tshow('#appCredentialEdit');\n\t\t\t});\n\t\t\t$(\"#appCredentialDelete\"+id).addEventListener('click',event=>{\n\t\t\t\tif(confirm('Do you really want to delete the data?')){\n\t\t\t\t\tfor(key of ['read','write','menu']){\n\t\t\t\t\t\tcredential=app.App.credential[key];\n\t\t\t\t\t\tif(credential.indexOf(id)>=0)credential.splice(credential.indexOf(id),1);\n\t\t\t\t\t}\n\t\t\t\t\t$('#appCredential'+id).remove();\n\t\t\t\t\tmodal('Success','Successfully removed','green');\n\t\t\t\t}\n\t\t\t});\n\t\t}\n\t});\t\n}\n\napp.credentialIndex=credential=>{\n\tgroupIndex=[].concat(credential.menu,credential.read,credential.write)\n\tgroupIndex=groupIndex.filter((item,pos)=>groupIndex.indexOf(item)===pos);\n\treturn groupIndex.join();\n}\n\n$('#appCredentialNew').addEventListener('click',()=>{\n\t$('#appCredentialEditName').innerHTML='';\n\t$('#appCredentialEditData').reset();\n\tshow('#appCredentialEdit');\t\n});\n\napp.credentialSave=data=>{\n\tif(app.credentialId!='0'){\n\t\tlet remove=0;\n\t\tfor(field in data){\n\t\t\tcredential=app.App.credential[field.replace('credentialEdit','').toLowerCase()];\n\t\t\tif(data[field]=='1'){\n\t\t\t\tremove+=1;\n\t\t\t\tif(!credential.includes(app.credentialId))credential.push(app.credentialId);\n\t\t\t}else{\n\t\t\t\tif(credential.indexOf(app.credentialId)>=0)credential.splice(credential.indexOf(app.credentialId),1);\n\t\t\t}\n\t\t}\n\t\tif(remove==0)$('#app.Credential'+app.credentialId).remove();\n\t\tapp.credentialLoad();\n\t}\n\thide('#appCredentialEdit');\n}\nform('appCredentialEdit',app.credentialSave);\n\n//group\napp.filterGroup;\n$('#appCredentialEditGroupFilter').addEventListener('keyup',event=>{\n\tclearTimeout(app.filterGroup);\n\tapp.filterGroup=setTimeout(app.groupList,400,hash(event.target.value));\n});\n\napp.groupList=word=>{\n\tif(word){\n\t\tlet groupList=$('#appGroupFilterList');\n\t\tshow('#appGroupFilterList');\n\t\tgroupList.innerHTML=\"<figure class='w3-center'><img src='load.gif' width='25'></figure>\";\n\t\tread('groups','hash;>=;'+word,'hash',5).then(data=>{\n\t\t\tgroupList.innerHTML='';\n\t\t\tif(data.valueOf()){\n\t\t\t\tapp.Groups=Object.assign(app.Groups,data);\n\t\t\t\tfor(const id in data){\n\t\t\t\t\t$('#appGroupFilterList').insertAdjacentHTML('beforeend',`<a id='addGroup${id}' class='w3-small w3-bar-item w3-btn'>${data[id].name}</a>`);\n\t\t\t\t\t$('#addGroup'+id).addEventListener('click',()=>{\n\t\t\t\t\t\tapp.credentialId=id;\n\t\t\t\t\t\t$('#appCredentialEditName').innerHTML=app.Groups[id].name;\n\t\t\t\t\t\t$('#appCredentialEditGroupFilter').value='';\n\t\t\t\t\t\thide('#appGroupFilterList');\n\t\t\t\t\t});\t\n\t\t\t\t}\n\t\t\t}\n\t\t});\n\t}else{\n\t\thide('#appGroupFilterList');\n\t}\n}",
			"credential": {
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				],
				"menu": []
			}
		},
		"groups": {
			"hash": "groups",
			"dad": "admin",
			"html": "<article class='w3-container' id='group'>\n\t<h3 class='w3-container'>\n\t\tGroups <span class='w3-small' id='groupBoss'></span>\n\t</h3>\n\t<!--List-->\n\t<table class='w3-table-all w3-hoverable w3-card'>\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t<th>Name</th>\n\t\t\t\t<th class='w3-right'>\n\t\t\t\t\t<button class='w3-btn w3-deep-orange w3-right w3-tiny w3-round w3-e' id='groupFilterBtn'>\n\t\t\t\t\t\t<span class='w3-w'>Filter</span>\n\t\t\t\t\t\t<span class='w3-y'>F</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='groupNewBtn'>\n\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t</button>\n\t\t\t\t</th>\n\t\t\t</tr><tr>\n\t\t\t\t<td class='w3-padding-0' colspan='4'>\n\t\t\t\t\t<span class='w3-hide w3-center' id='groupFilter'>\n\t\t\t\t\t\t<input class='w3-input' id='groupFilterName' placeholder='&#9655; Name &#9665;' type='text'>\n\t\t\t\t\t</span>\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody id='groupList'>\n\t\t</tbody>\n\t</table>\n\t\n\t<!--Edit-->\n\t<section class='w3-modal' id='groupEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='groupEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='groupEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-<!--theme-color-->'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding' ID='groupEditLabel'>Group</legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Boss</label>\n\t\t\t\t\t\t<select class='w3-input' id='groupEditBoss' name='groupEditBoss' required></select>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' id='groupEditName' name='groupEditName' placeholder='name' type='text' required>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='groupEditBtn'>\n\t\t\t\t\t\t\t<button class='w3-btn w3-red w3-round' id='groupEditCancel' type='reset'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='groupEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='groupEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</section>\n\t\n</article>",
			"credential": {
				"menu": [],
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"javascript": "group.Group={};\ngroup.Groups={};\ngroup.Bosses=[];\ngroup.Bosses['none']={\"id\":\"none\",\"name\":\"None\",\"label\":\"None\"};\ngroup.Boss={\"id\":\"none\",\"name\":\"None\"};\n\ngroup.filterTime;\n$('#groupFilterName').addEventListener('keyup',event=>{\n\tclearTimeout(group.filterTime);\n\tfilterTime=setTimeout(group.list,400,group.Boss);\n});\n$('#groupFilterBtn').addEventListener('click',()=>flip('#groupFilter'));\n\n$('#groupNewBtn').addEventListener('click',()=>{\n\t$('#groupEditData').reset();\n\t$('#groupEditLabel').innerHTML='New group';\n\tgroup.Group=Object.assign({\t\n\t\t\"id\":key(),\n\t\t\"name\":\"\",\n\t\t\"boss\":group.Boss.id,\n\t\t\"hash\":\"0\"\n\t});\n\tgroup.boss(group.Boss.id);\n\tshow('#groupEdit');\n});\n\ngroup.boss=id=>{\n\t$('#groupEditBoss').innerHTML='';\n\tif(group.Boss.id!='none')$('#groupEditBoss').innerHTML+=`<option value='${group.Bosses[group.Boss.id].id}'>${group.Bosses[group.Boss.id].name}`;\n\t$('#groupEditBoss').innerHTML+=`<option value='${group.Boss.id}' selected>${group.Boss.name}`;\n\tfor(id in group.Groups)if(group.Groups[id].boss==group.Boss.id&&id!=group.Group.hash)$('#groupEditBoss').innerHTML+=`<option value='${id}'>${group.Groups[id].name}`;\n}\n\ngroup.list=boss=>{\n\tgroup.Boss=boss;\n\tlocal=boss.id;\n\tlabel='';\n\twhile(local!=`none`){\n\t\tlabel=group.Bosses[local].label+'/'+label;\n\t\tlocal=group.Bosses[local].id;\n\t}\t\n\t$('#groupBoss').innerHTML='/'+label;\n\t$('#groupList').innerHTML=`<tr id='groupLoad'>\n\t\t<td colspan='3' class='w3-center'><img src='load.gif' alt='loading' width='50'></td>\n\t</tr>`;\n\tlet filter=`boss;==;${boss.id}`;\n\tfilter+=$('#groupFilterName').value!=''?`|hash;>=;${hash($('#groupFilterName').value)}`:'';\n\tread('groups',filter,'hash').then(data=>{\n\t\t$('#groupList').innerHTML='';\n\t\tif(data.length>=0){\n\t\t\tgroup.Groups=Object.assign(data);\n\t\t\tfor(const id in data){\n\t\t\t\tgroup.Bosses[id]={'id':data[id].boss,'name':boss.name,'label':data[id].name};\n\t\t\t\t$('#groupList').insertAdjacentHTML('beforeend',`<tr>\n\t\t\t\t\t<td class='w3-point' id='groupBoss${id}'>${data[id].name}</td>\n\t\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='groupEdit${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='groupDelete${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>`);\n\t\t\t\t$('#groupBoss'+id).addEventListener('click',()=>group.list({\"id\":id,\"name\":data[id].name}));\n\t\t\t\t$('#groupEdit'+id).addEventListener('click',()=>{\n\t\t\t\t\tgroup.Group=Object.assign({},group.Groups[id]);\n\t\t\t\t\tgroup.boss(id);\t\n\t\t\t\t\t$('#groupEditData').reset();\n\t\t\t\t\t$('#groupEditLabel').innerHTML=group.Group.name;\n\t\t\t\t\t$('#groupEditBoss').value=group.Group.boss;\n\t\t\t\t\t$('#groupEditName').value=group.Group.name;\n\t\t\t\t\tshow('#groupEdit');\n\t\t\t\t});\n\t\t\t\t$('#groupDelete'+id).addEventListener('click',()=>{\n\t\t\t\t\tif(confirm('Do you really want to delete the group?')){\n\t\t\t\t\t\terase('groups/'+id).then(()=>{\n\t\t\t\t\t\t\tgroup.list(group.Boss);\n\t\t\t\t\t\t\tmodal('Success','Group deleted successfully','green');\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t}\n\t\t\tif(boss.id!='none'){\n\t\t\t\t$('#groupList').insertAdjacentHTML('afterbegin',\"<tr><td colspan='3' class='w3-point' id='groupAbove'>Above</td></tr>\");\n\t\t\t\t$('#groupAbove').addEventListener('click',()=>group.list(group.Bosses[boss.id]));\n\t\t\t}\n\t\t}else{\n\t\t\t$('#groupList').innerHTML=\"<tr id='groupLoad'><td colspan='3' class='w3-center'>Empty</td></tr>\";\n\t\t}\n\t});\n}\ngroup.list({\"id\":\"none\",\"name\":\"None\"});\n\ngroup.save=data=>{\n\tgroup.Group.name=data.name;\n\tgroup.Group.hash=hash(data.name);\n\tgroup.Group.boss=data.boss;\n\twrite('groups',group.Group,group.Group.id).then(()=>{\n\t\tshow('#groupEditBtn');\n\t\thide('#groupEditLoad');\n\t\thide('#groupEdit');\n\t\tgroup.list(group.Boss);\n\t\tmodal('Success','Data saved successfully','green');\n\t});\n}\n\ngroup.check=data=>{\n\thide('#groupEditBtn');\n\tshow('#groupEditLoad');\n\tif(group.hash=='0'||group.Group.name!=data.name){\n\t\tread(`groups` ,`hash;==;${hash(data.name)}`,'',1).then(snap=>{\n\t\t\tif(snap.length>0){\n\t\t\t\tshow('#groupEditBtn');\n\t\t\t\thide('#groupEditLoad');\n\t\t\t\tmodal('Caution','The chosen name already exists','yellow');\n\t\t\t}else{\n\t\t\t\tgroup.save(data);\n\t\t\t}\n\t\t});\n\t}else{\n\t\tgroup.save(data);\n\t}\n}\n\nform('groupEdit',group.check);",
			"module": "none",
			"name": "Groups"
		},
		"join": {
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"menu": [
					"<!--common-->"
				]
			},
			"dad": "pages",
			"module": "none",
			"name": "Join",
			"hash": "join",
			"javascript": "join.user={}\n\njoin.change=data=>{\n\tif(join.user.id=='0'){\n\t\tAuth.createUserWithEmailAndPassword(data.email,data.password).then(()=>{\n\t\t\tjoin.user.password=data.password;\n\t\t\tjoin.user.id=Auth.currentUser.uid;\n\t\t\tuser=Auth.currentUser;\n\t\t\tuser.updateProfile({displayName:data.name,photoURL:'common'}).then(()=>{\n\t\t\t\tuser.sendEmailVerification({url:`https://${location.hostname}`}).then(()=>{\n\t\t\t\t\tuser.updateProfile({displayName:common,photoURL:'common'}).then(()=>{\n\t\t\t\t\t\tshow('#joinEditNewPwd');\n\t\t\t\t\t\tjoin.save(data);\n\t\t\t\t\t\tmodal('Success','Your registration was successful.<br><br>Validate your email to activate your access.<br>','green');\n\t\t\t\t\t});\n\t\t\t\t});\n\t\t\t});\n\t\t});\n\t}else{\n\t\tAuth.signInWithEmailAndPassword(join.user.email,join.user.password).then(()=>{\n\t\t\tuser=Auth.currentUser;\n\t\t\tuser.updatePassword(data.newpassword).then(()=>{\n\t\t\t\tif(data.newpassword!='')join.user.password=data.newpassword;\n\t\t\t\tuser.updateEmail(data.email).then(()=>join.save(data));\n\t\t\t});\n\t\t});\n\t\tmodal('Success','Successfully changed data.<br>','green');\n\t}\n};\n\njoin.save=data=>{\n\tjoin.user.edited=new Date();\n\tjoin.user.name=data.name;\n\tjoin.user.hash=hash(data.name);\n\tjoin.user.group=common;\n\tjoin.user.email=data.email;\n\twrite('users',join.user,join.user.id).then(()=>main('join'));\n};\n\njoin.check=data=>{\n\tshow('#joinEditLoad');\n\thide('#joinEditBtn');\n\tif(join.user.id=='0'&&($('#joinEditPassword').value!=$('#joinEditCheck').value)||(join.user.id!='0'&&($('#joinEditNewPassword').value!=$('#joinEditNewCheck').value))){\n\t\tmodal('Caution','Password checks must equal password','yellow');\n\t\tshow('#joinEditBtn');\n\t\thide('#joinEditLoad');\n\t\treturn false;\n\t}\n\tif(join.user.id=='0'||(join.user.id!='0'&&join.user.email!=data.email)){\n\t\tAuth.fetchSignInMethodsForEmail(data.email).then(obj=>{\n\t\t\tif(obj[0]){\n\t\t\t\tmodal('Caution','User already exists','yellow');\n\t\t\t\tshow('#joinEditBtn');\n\t\t\t\thide('#joinEditLoad');\n\t\t\t}else{\n\t\t\t\tjoin.change(data);\n\t\t\t}\n\t\t});\n\t}else{\n\t\tjoin.change(data);\n\t}\n};\n\njoin.start=()=>{\n\tform('joinEdit',join.check);\n\tif(user){\n\t\tread(`users/${user.uid}`).then(data=>{\n\t\t\tjoin.user=Object.assign({},data);\n\t\t\t$('#joinEditName').value=data.name;\n\t\t\t$('#joinName').innerHTML=data.name;\n\t\t\t$('#joinEditEmail').value=data.email;\n\t\t\t$('#joinEmail').innerHTML=data.email;\n\t\t\t$('#joinEditTermsOk').required=false;\n\t\t\t$('#joinEditCheck').required=false;\n\t\t\t$('#joinEditUser').addEventListener('click',()=>show('#joinEdit'));\n\t\t\tshow('#joinEditNewPwd');\n\t\t\thide('#joinEditCheck');\n\t\t\thide('#joinEditTerms');\n\t\t\thide('#joinLoading');\n\t\t});\n\t}else{\n\t\tjoin.user=Object.assign({},{\n\t\t\t\"id\":\"0\",\n\t\t\t\"created\":new Date(),\n\t\t\t\"edited\":new Date(),\n\t\t\t\"deleted\":\"0\",\n\t\t\t\"hash\":\"\",\n\t\t\t\"group\":\"\",\n\t\t\t\"name\":\"\",\n\t\t\t\"email\":\"\",\n\t\t\t\"password\":\"\"\n\t\t});\n\t\tshow('#joinEditCheck');\n\t\thide('#joinProfile');\n\t\t$('#joinEditCheck').required=true;\n\t\t$('#joinEditClose').addEventListener('click',()=>location.hash=`#home`);\n\t\t$('#joinEditCancel').addEventListener('click',()=>location.hash=`#home`);\n\t\t$('#joinEditTermsOk').required=true;\n\t\thide('#joinEditNewPwd');\n\t\tshow('#joinEditTerms');\n\t\tshow('#joinEdit');\n\t\tread('apps/terms').then(data=>{\n\t\t\t$('#joinEditTerm').innerHTML=data.html;\n\t\t\thide('#joinLoading');\n\t\t});\n\t}\n}\n\n$('#joinDeleteUser').addEventListener('click',()=>{\n\tif(confirm('Do you really want to delete your information?')){\t\t\n\t\tjoin.user.deleted=new Date();\n\t\twrite('users',join.user,user.uid).then(()=>{\n\t\t\tAuth.signInWithEmailAndPassword(join.user.email,join.user.password).then(()=>{\n\t\t\t\tAuth.currentUser.delete().then(()=>{\n\t\t\t\t\thide('#joinLoading');\n\t\t\t\t\tjoin.user={};\n\t\t\t\t\tlocation.hash=`#home`;\n\t\t\t\t\tmodal('Success','Data deleted successfully','green');\n\t\t\t\t});\n\t\t\t});\n\t\t});\n\t}\t\n});\n\njoin.start();",
			"html": "<article class='w3-container w3-animate-opacity w3-padding' id='join'>\n\n\t<section class='w3-card' id='joinProfile'>\n\t\t<h3 class='w3-container' id='joinName'>\n\t\t\tJoin\n\t\t</h3>\n\t\t<div class='w3-container'>\n\t\t\t<b class='w3-wide'>E-mail:</b> <span id='joinEmail'>email@mail.com</span>\n\t\t\t<br>\n\t\t\t<p class='w3-center'>\n\t\t\t\t<button class='w3-btn w3-round w3-green' id='joinEditUser'>Edit profile</button>\n\t\t\t\t<button class='w3-btn w3-round w3-red' id='joinDeleteUser'>Delete profile</button>\n\t\t\t</p>\n\t\t</div>\n\t</section>\n\n\t<section class='w3-modal' id='joinEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='joinEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='joinEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-<!--theme-color-->'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding'>Join</legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='name' id='joinEditName' name='joinEditName' placeholder='name' type='text' pattern='(\\S{1,}\\s\\S{1,}[\\s\\S]*)?' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>E-mail</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='email' id='joinEditEmail' name='joinEditEmail' placeholder='e-mail' type='email' pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>Password</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='joinEditPassword' name='joinEditPassword' placeholder='Password' minlength='6' type='password' required>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='joinEditCheck' name='joinEditCheck' placeholder='Repeat password' minlength='6' type='password' required>\n\t\t\t\t\t\t<div class='w3-center w3-show' id='joinEditTerms'>\n\t\t\t\t\t\t\t<div class='w3-light-gray' id='joinEditTerm' style='height:50px;overflow-y:scroll;text-align:left!important'></div>\n\t\t\t\t\t\t\t<input type='checkbox' id='joinEditTermsOk' name='joinEditTermsOk' required> I have read and accepted the terms of use.\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class='w3-hide' id='joinEditNewPwd'>\n\t\t\t\t\t\t\t<label class='w3-text-blue'>New password</label>\t\t\t\t\t\t\n\t\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='joinEditNewPassword' name='joinEditNewPassword' placeholder='New Password' minlength='6' type='password'>\n\t\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='joinEditNewCheck' name='joinEditNewCheck' placeholder='Repeat new password' minlength='6' type='password'>\n\t\t\t\t\t\t</div>\t\t\t\t\t\t\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='joinEditBtn'>\n\t\t\t\t\t\t\t<button class='w3-btn w3-red w3-round' id='joinEditCancel' type='button'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='joinEditSave'>Save</button>\n\t\t\t\t\t\t</p>\t\t\t\t\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='joinEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' alt='load' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</section>\n\n\t<section id='joinLoading' class='w3-modal w3-animate-opacity w3-show'>\n\t\t<img class='w3-display-middle' src='load.gif'>\n\t</section>\n\n</article>"
		},
		"kiai": {
			"credential": {
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				],
				"menu": []
			},
			"dad": "admin",
			"html": "<article class='w3-container' id='kiai'>\n\t<section class='w3-panel' id='kiaiForm'>\n\t\t<form method='post' action='http://127.0.0.1:5001/<!--project-name-->/us-central1/kiai' onsubmit='return kiai(this)' class='w3-panel w3-card w3-padding-16'>\n\t\t<fieldset>\n\t\t\t<legend class='w3-text-<!--theme-color--> w3-xlarge w3-border-color-<!--theme-color-->'> Create your site </legend>\n\t\t\t\t<p>\n\t\t\t\t\t<input name='kiaiTitle' id='kiaiTitle' class='w3-input'>\n\t\t\t\t\t<label class='w3-opacity' for='kiaiTitle'>Title</label>\n\t\t\t\t</p>\n\t\t\t\t<p>\n\t\t\t\t\t<textarea name='kiaiDescription' id='kiaiDescription' class='w3-input'></textarea>\t\t\t\t\t\n\t\t\t\t\t<label class='w3-opacity'  for='kiaiDescription'>Description</label>\n\t\t\t\t</p>\n\t\t\t\t<p class='w3-center'>\n\t\t\t\t\t<button class='w3-button w3-<!--theme-color--> w3-round' id='jigPost'> Create </button>\n\t\t\t\t</p>\n\t\t\t</fieldset>\n\t\t</form>\n\t</section>\t\t\t\n\t<section class='w3-panel' id='kiaiResponse'>\n\t\t<div class='w3-card  w3-panel w3-padding-16' id='kiaiView' style='display:none'></div>\n\t\t<div class='w3-card  w3-panel w3-padding-16' id='kiaiLoad' style='display:none'>\n\t\t\t<h3 class='w3-center w3-text-<!--theme-color-->'>Await a moment, create content!</h3>\n\t\t\t<p class='w3-center'><img src='load.gif'></p>\n\t\t</div>\n\t</section>\n</article>",
			"module": "none",
			"hash": "kiai",
			"javascript": "//kiai\n\n//Request Kiai content\nfunction kiai(f){\n\t//Set variables\n\tlet form = new FormData(f);\n\tlet json = Object.fromEntries(form.entries());\n\tjson.kiaiDescription = json.kiaiDescription.replaceAll('\\n','\\\\n');\n\tlet value = JSON.stringify(json)\n\n\t//Set display on request\n\tkiaiForm.style = 'display:none';\n\tkiaiView.style = 'display:none';\n\tkiaiLoad.style = 'display:block';\n\t\n\t//Post data\n\tfetch(f.action,{\n\t\tmethod : 'POST',\n\t\theader : {'Content-Type': 'application/json; charset=UTF-8'},\n\t\tbody: value.replaceAll('\\n','\\\\\\\\n'),\n\t}).then(response=>{\n\t\t//receive fetch\n\t\treturn response.text();\n\t}).then(myText=>{\n\t\t//Response to ok fetch\n\t\tlet data = JSON.parse(myText);\n\t\tkiaiForm.style = 'display:block';\n\t\tkiaiView.style = 'display:block';\n\t\tkiaiLoad.style = 'display:none';\n\t\tdeploy(data.title,'kiai');\n\t\tkiaiView.innerHTML = `<p>The ${data.title} page was created successfully, <a href='#${data.hash}' target='${data.hash}'>click here</a> to see the results.</p>`;\n\t}).catch(error=>{\n\t\t//Response to error fetch\n\t\tkiaiForm.style = 'display:block';\n\t\tkiaiView.style = 'display:block';\n\t\tkiaiLoad.style = 'display:none';\n\t\tkiaiView.innerHTML = `<div class='w3-red w3-panel w3-center'><h4>Error generating the \"${kiaiTitle.value}\" page.</h4><p class='w3-opacity'>${error.message}</p></div>`;\n\t});\t\t\t\n\treturn false;\n}",
			"name": "Kiai"
		},
		"login": {
			"hash": "login",
			"html": "<section id='login' class='w3-modal w3-animate-opacity'>\n\t<div class='w3-modal-content w3-round'>\n\t\t<div class='w3-container'>\n\t\t\t<button id='loginClose' class='w3-btn w3-round w3-red w3-display-topright w3-tiny'><b>&times;</b></button>\n\t\t\t<form class='w3-container w3-padding-16' id='loginData'>\n\t\t\t\t<fieldset class='w3-round w3-border-blue'>\n\t\t\t\t\t<legend class='w3-container w3-large w3-text-blue w3-padding'>Login</legend>\n\t\t\t\t\t<label for='loginEmail' class='w3-text-blue'>E-mail</label>\n\t\t\t\t\t<input id='loginEmail' name='loginEmail' class='w3-input' type='email' placeholder='e-mail' autocomplete='email' required>\n\t\t\t\t\t<label for='loginPassword' class='w3-text-blue'>Password</label>\n\t\t\t\t\t<input id='loginPassword' name='loginPassword' class='w3-input' type='password' placeholder='Password'  autocomplete='current-password' required>\n\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='loginBtn'>\n\t\t\t\t\t\t<button id='loginCancel' type='button' class='w3-btn w3-red w3-round'>Cancel</button>\n\t\t\t\t\t\t<button id='loginSubmit' class='w3-btn w3-blue w3-round'>Login</button>\n\t\t\t\t\t</p>\n\t\t\t\t\t<p class='w3-center w3-hide' id='loginLoad'>\n\t\t\t\t\t\t<img src='load.gif' alt='Loading' width='50'>\n\t\t\t\t\t</p>\n\t\t\t\t</fieldset>\n\t\t\t</form>\n\t\t</div>\n\t</div>\n</section>",
			"credential": {
				"read": [
					"<!--common-->",
					"<!--super-user-->"
				],
				"menu": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"javascript": "login.logon=data=>{\n\thide(`#loginBtn`);\n\tshow(`#loginLoad`);\n\tAuth.signInWithEmailAndPassword(data.email,data.password).then(data=>{\n\t\tuser=data.user\n\t\t$(`#loginData`).reset();\n\t\tshow(`#loginBtn`);\n\t\thide(`#loginLoad`);\n\t\thide(`#login`);\n\t\tsetTimeout(()=>{window.location=`#home`},50);\n\t\tmodal(`Success`,`Login successfully`,`green`);\n\t}).catch(error=>{\n\t\tshow(`#loginBtn`);\n\t\thide(`#loginLoad`);\n\t\tmodal(`Error`,`Failed to login`,`red`);\n\t})\n}\n\nlogin.logoff=()=>{\n\tAuth.signOut().then(()=>{\n\t\tuser=null;\n\t\tsetTimeout(()=>{window.location=`#home`},50);\n\t\tmodal(`Success`,`Successful logoff`,`green`);\n\t}).catch(error=>{\n\t\tconsole.log(error);\n\t})\n}\n\nform(`login`,login.logon);",
			"module": "footer",
			"name": "Login",
			"dad": "modules"
		},
		"logo": {
			"dad": "modules",
			"credential": {
				"menu": [],
				"read": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"name": "Logo",
			"html": "<figure class='w3-margin-0 w3-padding-0 w3-bar-item'>\n\t<img class='w3-left w3-point' src='logo.webp' alt='P.O.W.' title='P.O.W.' width='100%' height='56' id='logo'>\n</figure>",
			"module": "header",
			"hash": "logo",
			"javascript": "$(`#logo`).addEventListener(`click`,()=>window.location=`#home`);"
		},
		"menu": {
			"html": "<nav class='w3-dropdown-hover w3-right w3-bar-item w3-padding-16 w3-<!--theme-color-->' id='menu'>\n\t<img src='menu.webp' alt='menu' width='25' height='25'>\n\t<div class='w3-dropdown-content w3-bar-block w3-card w3-border w3-border-<!--theme-color--> w3-animate-opacity' style='right:0px;top:57px'>\n\t\t<span id='menuList'></span>\n\t</div>\n</nav>",
			"javascript": "menu.list=()=>{\n\t$('#menuList').innerHTML='';\n\tread('apps','credential.menu;array-contains;'+(user?(user.displayName?user.displayName:common):common),'hash').then(data=>{\n\t\twindow.d=data;\n\t\tfor(const key in data)$('#menuList').insertAdjacentHTML('beforeend',`<a href='#${data[key].hash}' id='${data[key].hash}Menu' class='w3-bar-item w3-button'>${data[key].name}</a>`);\n\t\t$('#loginMenu').innerText=user?'Logoff':'Login';\n\t\t$('#loginMenu').addEventListener('click',event=>{\n\t\t\tevent.preventDefault();\n\t\t\tuser?login.logoff():show('#login');\n\t\t});\n\t});\n}\nAuth.onAuthStateChanged(()=>menu.list());",
			"hash": "menu",
			"dad": "modules",
			"module": "header",
			"credential": {
				"read": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"menu": [],
				"write": [
					"<!--super-user-->"
				]
			},
			"name": "Menu"
		},
		"modal": {
			"javascript": "$('#modalClose').addEventListener('click',()=>hide('#modalApp'));\nfunction modal(title,message,color){\n\t$('#modalTitle').innerHTML=title;\n\t$('#modalMessage').innerHTML=message;\n\t$('#modalColor').className='w3-container'+color?' w3-'+color:'';\n\tshow('#modalApp');\n}",
			"dad": "modules",
			"credential": {
				"menu": [],
				"read": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"hash": "modal",
			"html": "<section id='modalApp' class='w3-modal w3-animate-opacity'>\n\t<div class='w3-modal-content'>\n\t\t<div id='modalColor' class='w3-panel'>\n\t\t\t<button id='modalClose' class='w3-button w3-round w3-display-topright'>&times;</button>\n\t\t\t<h2 class='w3-container' id='modalTitle'>Title</h2>\n\t\t\t<p class='w3-padding w3-center' id='modalMessage'>Message</p>\n\t\t</div>\n\t</div>\n</section>",
			"module": "footer",
			"name": "Modal"
		},
		"model": {
			"module": "none",
			"html": "<article class='w3-container' id='model'>\n\t<h3 class='w3-container'>\n\t\tModel\n\t</h3>\n\t<!--List-->\n\t<table class='w3-table-all w3-hoverable w3-card'>\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t<th>Name</th>\n\t\t\t\t<th class='w3-right'>\n\t\t\t\t\t<button class='w3-btn w3-deep-orange w3-right w3-tiny w3-round w3-e' id='modelFilterBtn'>\n\t\t\t\t\t\t<span class='w3-w'>Filter</span>\n\t\t\t\t\t\t<span class='w3-y'>F</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='modelNewBtn'>\n\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t</button>\n\t\t\t\t</th>\n\t\t\t</tr><tr>\n\t\t\t\t<td class='w3-padding-0' colspan='4'>\n\t\t\t\t\t<span class='w3-hide w3-center' id='modelFilter'>\n\t\t\t\t\t\t<input class='w3-input' id='modelFilterName' placeholder='&#9655; Name &#9665;' type='text'>\n\t\t\t\t\t</span>\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody id='modelList'>\n\t\t</tbody>\n\t</table>\n\t\n\t<!--Edit-->\n\t<section class='w3-modal' id='modelEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='modelEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='modelEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-<!--theme-color-->'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding' ID='modelEditLabel'>Categoria</legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' id='modelEditName' name='modelEditName' placeholder='name' type='text' required>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='modelEditBtn'>\n\t\t\t\t\t\t\t<button class='w3-btn w3-red w3-round' id='modelEditCancel' type='reset'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='modelEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='modelEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</section>\t\n</article>",
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->"
				],
				"menu": []
			},
			"dad": "models",
			"name": "Model",
			"javascript": "/* model.js */\nmodel.Model={};\nmodel.Models={};\nmodel.db='model';\n\nmodel.filterTime;\n$('#modelFilterName').addEventListener('keyup',event=>{\n\tclearTimeout(model.filterTime);\n\tfilterTime=setTimeout(model.list,400);\n});\n$('#modelFilterBtn').addEventListener('click',()=>flip('#modelFilter'));\n\n$('#modelNewBtn').addEventListener('click',()=>{\n\t$('#modelEditData').reset();\n\t$('#modelEditLabel').innerHTML='New model';\n\tmodel.Model=Object.assign({\t\n\t\t\"id\":key(),\n\t\t\"name\":\"\",\n\t\t\"hash\":\"0\"\n\t});\n\tshow('#modelEdit');\n});\n\nmodel.list=()=>{\n\t$('#modelList').innerHTML=`<tr id='modelLoad'>\n\t\t<td colspan='3' class='w3-center'><img src='load.gif' alt='loading' width='50'></td>\n\t</tr>`;\n\tlet filter=$('#modelFilterName').value!=''?`hash;>=;${hash($('#modelFilterName').value)}`:'';\n\tread(model.db,filter,'hash').then(data=>{\n\t\t$('#modelList').innerHTML='';\n\t\tif(data.length>=0){\n\t\t\tmodel.Models=Object.assign(data);\n\t\t\tfor(const id in data){\n\t\t\t\t$('#modelList').insertAdjacentHTML('beforeend',`<tr>\n\t\t\t\t\t<td class='w3-point' id='modelBoss${id}'>${data[id].name}</td>\n\t\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='modelEdit${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='modelDelete${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>`);\n\t\t\t\t$('#modelEdit'+id).addEventListener('click',()=>{\n\t\t\t\t\tmodel.Model=Object.assign({},model.Models[id]);\n\t\t\t\t\t$('#modelEditData').reset();\n\t\t\t\t\t$('#modelEditLabel').innerHTML=model.Model.name;\n\t\t\t\t\t$('#modelEditName').value=model.Model.name;\n\t\t\t\t\tshow('#modelEdit');\n\t\t\t\t});\n\t\t\t\t$('#modelDelete'+id).addEventListener('click',()=>{\n\t\t\t\t\tif(confirm('Do you really want to delete the model?')){\n\t\t\t\t\t\terase(`${model.db}/${id}`).then(()=>{\n\t\t\t\t\t\t\tmodel.list();\n\t\t\t\t\t\t\tmodal('Success','Model deleted successfully','green');\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t}\n\t\t}else{\n\t\t\t$('#modelList').innerHTML=\"<tr id='modelLoad'><td colspan='3' class='w3-center'>Empty</td></tr>\";\n\t\t}\n\t});\n}\nmodel.list({\"id\":\"none\",\"name\":\"None\"});\n\nmodel.save=data=>{\n\tmodel.Model.name=data.name;\n\tmodel.Model.hash=hash(data.name);\n\twrite(model.db,model.Model,model.Model.id).then(()=>{\n\t\tshow('#modelEditBtn');\n\t\thide('#modelEditLoad');\n\t\thide('#modelEdit');\n\t\tmodel.list();\n\t\tmodal('Success','Data saved successfully','green');\n\t});\n}\n\nmodel.check=data=>{\n\thide('#modelEditBtn');\n\tshow('#modelEditLoad');\n\tif(model.hash=='0'||model.Model.name!=data.name){\n\t\tread(model.db ,`hash;==;${hash(data.name)}`,'',1).then(snap=>{\n\t\t\tif(snap.length>0){\n\t\t\t\tshow('#modelEditBtn');\n\t\t\t\thide('#modelEditLoad');\n\t\t\t\tmodal('Caution','The chosen name already exists','yellow');\n\t\t\t}else{\n\t\t\t\tmodel.save(data);\n\t\t\t}\n\t\t});\n\t}else{\n\t\tmodel.save(data);\n\t}\n}\n\nform('modelEdit',model.check);",
			"hash": "model"
		},
		"models": {
			"javascript": "",
			"dad": "system",
			"module": "none",
			"html": "",
			"hash": "models",
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"menu": [],
				"read": [
					"<!--super-user-->"
				]
			},
			"name": "Models"
		},
		"modules": {
			"html": "",
			"name": "Modules",
			"hash": "modules",
			"dad": "system",
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->",
					"<!--common-->"
				],
				"menu": []
			},
			"javascript": "",
			"module": "none"
		},
		"pages": {
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->"
				],
				"menu": []
			},
			"hash": "pages",
			"module": "none",
			"html": "<article class='w3-container' id='pages'>\n\t<section class='w3-panel w3-card'>\n\t<fieldset class='w3-panel w3-round w3-border-<!--theme-color-->'>\n\t\t<legend class='w3-container w3-text-<!--theme-color-->'><h1>Pages</h1></legend>\n\t\t<ul id='pagesList'></ul>\n\t\t<br>\n\t</fieldset>\n\t</section>\n</article>",
			"dad": "root",
			"name": "Pages",
			"javascript": "pages.list=()=>{\n\tpagesDescription = {\n\t\t'home' : 'System home page',\n\t\t'help' : 'Help documents',\n\t\t'join' : 'Join us',\n\t\t'mitosis' : 'Create a copy of the system',\n\t\t'terms' : 'Software terms of use',\n\t};\n\t$(`#pagesList`).innerHTML=`<p class='w3-center'><img src='load.gif' alt='loading' width='50'></p>`;\n\tread(`apps`,`credential.read;array-contains;${user.displayName}|dad;==;pages`,`hash`).then(data=>{\n\t\t$('#pagesList').innerHTML='';\t\t\n\t\tfor(const id in data){\n\t\t\tpageDescription = pagesDescription[data[id].hash]?`<br><span class='w3-text-<!--theme-color--> w3-opacity'>${pagesDescription[data[id].hash]}</span>`:'';\n\t\t\t$(`#pagesList`).insertAdjacentHTML(`beforeend`,`<li class='w3-text-<!--theme-color--> w3-padding-16'>\n\t\t\t<a href='#${data[id].hash}' class='w3-text-<!--theme-color--> w3-large' style='text-decoration:none'>${data[id].name}</a>\n\t\t\t${pageDescription}\n\t\t</li>`);\n\t\t}\n\t});\n}\npages.list();"
		},
		"products": {
			"javascript": "/* products.js */\nproducts.Product={};\nproducts.Products={};\nproducts.db='products';\n\nproducts.filterTime;\n$('#productsFilterName').addEventListener('keyup',event=>{\n\tclearTimeout(products.filterTime);\n\tfilterTime=setTimeout(products.list,400);\n});\n$('#productsFilterPrice').addEventListener('keyup',event=>{\n\tclearTimeout(products.filterTime);\n\tfilterTime=setTimeout(products.list,400);\n});\n$('#productsFilterStock').addEventListener('change',event=>{\n\tclearTimeout(products.filterTime);\n\tfilterTime=setTimeout(products.list,400);\n});\n$('#productsFilterBtn').addEventListener('click',()=>flip('#productsFilter'));\n\n$('#productsNewBtn').addEventListener('click',()=>{\n\t$('#productsEditData').reset();\n\t$('#productsEditLabel').innerHTML='New product';\n\tproducts.Product=Object.assign({\t\n\t\t\"id\":key(),\n\t\t\"name\":\"\",\n\t\t\"price\":\"\",\n\t\t\"stock\":\"\",\n\t\t\"hash\":\"0\"\n\t});\n\tshow('#productsEdit');\n});\n\nproducts.list=()=>{\n\t$('#productsList').innerHTML=`<tr id='productsLoad'>\n\t\t<td colspan='4' class='w3-center'><img src='load.gif' alt='loading' width='50'></td>\n\t</tr>`;\n\tlet filter='';\n\tif($('#productsFilterName').value!=''){\n\t\tfilter=`hash;>=;${hash($('#productsFilterName').value)}`;\n\t}\n\tif($('#productsFilterPrice').value!=''){\n\t\tif(filter!=''){\n\t\t\tfilter+=`;and;`;\n\t\t}\n\t\tfilter+=`price;==;${$('#productsFilterPrice').value}`;\n\t}\n\tif($('#productsFilterStock').value!=''){\n\t\tif(filter!=''){\n\t\t\tfilter+=`;and;`;\n\t\t}\n\t\tfilter+=`stock;==;${$('#productsFilterStock').value}`;\n\t}\n\tread(products.db,filter,'hash').then(data=>{\n\t\t$('#productsList').innerHTML='';\n\t\tif(data.length>=0){\n\t\t\tproducts.Products=Object.assign(data);\n\t\t\tfor(const id in data){\n\t\t\t\t$('#productsList').insertAdjacentHTML('beforeend',`<tr>\n\t\t\t\t\t<td class='w3-point' id='productsBoss${id}'>${data[id].name}</td>\n\t\t\t\t\t<td class='w3-point'>${data[id].price}</td>\n\t\t\t\t\t<td class='w3-point'>${data[id].stock}</td>\n\t\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='productsEdit${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='productsDelete${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>`);\n\t\t\t\t$('#productsEdit'+id).addEventListener('click',()=>{\n\t\t\t\t\tproducts.Product=Object.assign({},products.Products[id]);\n\t\t\t\t\t$('#productsEditData').reset();\n\t\t\t\t\t$('#productsEditLabel').innerHTML=products.Product.name;\n\t\t\t\t\t$('#productsEditName').value=products.Product.name;\n\t\t\t\t\t$('#productsEditPrice').value=products.Product.price;\n\t\t\t\t\t$('#productsEditStock').value=products.Product.stock;\n\t\t\t\t\tshow('#productsEdit');\n\t\t\t\t});\n\t\t\t\t$('#productsDelete'+id).addEventListener('click',()=>{\n\t\t\t\t\tif(confirm('Do you really want to delete the product?')){\n\t\t\t\t\t\terase(`${products.db}/${id}`).then(()=>{\n\t\t\t\t\t\t\tproducts.list();\n\t\t\t\t\t\t\tmodal('Success','Product deleted successfully','green');\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t}\n\t\t}else{\n\t\t\t$('#productsList').innerHTML=\"<tr id='productsLoad'><td colspan='4' class='w3-center'>Empty</td></tr>\";\n\t\t}\n\t});\n}\nproducts.list({\"id\":\"none\",\"name\":\"None\",\"price\":\"None\",\"stock\":\"None\"});\n\nproducts.save=data=>{\n\tproducts.Product.name=data.name;\n\tproducts.Product.price=data.price;\n\tproducts.Product.stock=data.stock;\n\tproducts.Product.hash=hash(data.name);\n\twrite(products.db,products.Product,products.Product.id).then(()=>{\n\t\tshow('#productsEditBtn');\n\t\thide('#productsEditLoad');\n\t\thide('#productsEdit');\n\t\tproducts.list();\n\t\tmodal('Success','Data saved successfully','green');\n\t});\n}\n\nproducts.check=data=>{\n\thide('#productsEditBtn');\n\tshow('#productsEditLoad');\n\tif(products.hash=='0'||products.Product.name!=data.name){\n\t\tread(products.db ,`hash;==;${hash(data.name)}`,'',1).then(snap=>{\n\t\t\tif(snap.length>0){\n\t\t\t\tshow('#productsEditBtn');\n\t\t\t\thide('#productsEditLoad');\n\t\t\t\tmodal('Caution','The chosen name already exists','yellow');\n\t\t\t}else{\n\t\t\t\tproducts.save(data);\n\t\t\t}\n\t\t});\n\t}else{\n\t\tproducts.save(data);\n\t}\n}\n\nform('productsEdit',products.check);",
			"html": "<article class='w3-container' id='products'>\n\t<h3 class='w3-container'>\n\t\tProducts\n\t</h3>\n\t<!--List-->\n\t<table class='w3-table-all w3-hoverable w3-card'>\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t<th>Name</th>\n\t\t\t\t<th>Price</th>\n\t\t\t\t<th>Stock</th>\n\t\t\t\t<th class='w3-right'>\n\t\t\t\t\t<button class='w3-btn w3-deep-orange w3-right w3-tiny w3-round w3-e' id='productsFilterBtn'>\n\t\t\t\t\t\t<span class='w3-w'>Filter</span>\n\t\t\t\t\t\t<span class='w3-y'>F</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='productsNewBtn'>\n\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t</button>\n\t\t\t\t</th>\n\t\t\t</tr><tr>\n\t\t\t\t<td class='w3-padding-0' colspan='4'>\n\t\t\t\t\t<span class='w3-hide w3-center' id='productsFilter'>\n\t\t\t\t\t\t<input class='w3-input' id='productsFilterName' placeholder='▷ Name ◁' type='text'>\n\t\t\t\t\t\t<input class='w3-input' id='productsFilterPrice' placeholder='▷ Price ◁' type='number'>\n\t\t\t\t\t\t<select class='w3-select' id='productsFilterStock'>\n\t\t\t\t\t\t\t<option value='' selected>▷ Stock ◁</option>\n\t\t\t\t\t\t\t<option value='disponible'>disponible</option>\n\t\t\t\t\t\t\t<option value='indisponible'>indisponible</option>\n\t\t\t\t\t\t</select>\n\t\t\t\t\t</span>\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody id='productsList'>\n\t\t</tbody>\n\t</table>\n\t\n\t<!--Edit-->\n\t<section class='w3-modal' id='productsEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='productsEditClose'>\n\t\t\t\t\t<b>×</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='productsEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-<!--theme-color-->'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding' ID='productsEditLabel'>Categoria</legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' id='productsEditName' name='productsEditName' placeholder='name' type='text' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>Price</label>\n\t\t\t\t\t\t<input class='w3-input' id='productsEditPrice' name='productsEditPrice' placeholder='price' type='number' step=\"0.01\" required>\n\t\t\t\t\t\t<label class='w3-text-blue'>Stock</label>\n\t\t\t\t\t\t<select class='w3-select' id='productsEditStock' name='productsEditStock' required>\n\t\t\t\t\t\t\t<option value='disponible'>disponible</option>\n\t\t\t\t\t\t\t<option value='indisponible'>indisponible</option>\n\t\t\t\t\t\t</select>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='productsEditBtn'>\n\t\t\t\t\t\t\t<button class='w3-btn w3-red w3-round' id='productsEditCancel' type='reset'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='productsEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='productsEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</section>\t\n</article>",
			"dad": "models",
			"name": "Products",
			"credential": {
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				],
				"menu": []
			},
			"module": "none",
			"hash": "products"
		},
		"home": {
			"credential": {
				"menu": [
					"<!--common-->",
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				],
				"read": [
					"<!--common-->",
					"<!--super-user-->"
				]
			},
			"module": "none",
			"html": "<article class='w3-margin w3-card w3-center' id='home'>\n\t<figure>\n\t\t<img class='w3-image' src='home.webp' style='max-width:256px!important' alt='<!--project-name-->'>\n\t</figure>\n\t<nav class='w3-bar'>\n\t\t<a class='w3-round w3-margin w3-card w3-btn w3-<!--theme-color--> w3-bar-item' id='homeSign'>Login</a>\n\t\t<a class='w3-round w3-margin w3-card w3-btn w3-<!--theme-color--> w3-bar-item' id='joinBtn' href='#join'>Join</a>\n\t</nav>\n</article>",
			"name": "Home",
			"javascript": "$(`#homeSign`).innerText=user?`Logoff`:`Login`;\n$(`#joinBtn`).innerText=user?`Perfil`:`Join`;\n$(`#homeSign`).addEventListener(`click`,event=>{\n\tevent.preventDefault();\n\tuser?login.logoff():show(`#login`);\n});",
			"hash": "home",
			"dad": "root"
		},
		"system": {
			"hash": "system",
			"dad": "root",
			"name": "System",
			"html": "",
			"javascript": "",
			"credential": {
				"write": [
					"<!--super-user-->"
				],
				"menu": [],
				"read": [
					"<!--super-user-->"
				]
			},
			"module": "none"
		},
		"template": {
			"hash": "template",
			"name": "Template",
			"credential": {
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				],
				"menu": [
					"<!--super-user-->"
				]
			},
			"javascript": "",
			"module": "none",
			"html": "<!-- Header -->\n<section class='w3-panel w3-white w3-center w3-padding-64' id='{title}Header'>\n\t<h1 class='w3-text-<!--theme-color--> w3-bold'>{Title}</h1>\n\t<h2 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle}</h2>\n</section>\n\n<!-- Fullbanner Header -->\n<section class='w3-display-container' id='{title}FullbannerHeader'>\n\t<img src='image/image.webp' alt='Mountains' style='width:100%'>\n\t<div class='w3-padding w3-display-middle'>\n\t\t<div class='w3-center'>\n\t\t\t<h1 class='w3-text-white w3-bold w3-shadow'>{Title}</h1>\n\t\t\t<p class='w3-large w3-text-white w3-opacity w3-shadow'>{Subtitle}</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Article -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Article[number]'>\n\t<article>\n\t\t<header>\n\t\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Article}</h2>\n\t\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle article}</h3>\n\t\t</header>\n\t\t<figure style='width:33%;float:left;margin:8px'>\n\t\t\t<img src='image/image.webp' alt='{altImage}' style='width:100%'>\n\t\t\t<figcaption class='w3-tiny'>{Figure caption}</figcaption>\n\t\t</figure>\n\t\t<div class='w3-justify' style='padding-left:16px'>\n\t\t\t<p>{Introduction with 500 characters}</p>\n\t\t\t<p>{News with 500 characters}</p>\n\t\t\t<p>{Conclusion with 500 characters}</p>\n\t\t</div>\n\t\t<footer class='w3-container w3-white w3-padding-16' style='clear:both'>\n\t\t\t<p class='w3-right w3-small'>{Author and data of creation}</p>\n\t\t</footer>\n\t</article>\n</section>\n\n<!-- Tables -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Table[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Table}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle table}</h3>\n\t</header>\n\t<table class='w3-table-all w3-hoverable w3-card w3-small'>\n\t\t<tr class='w3-<!--theme-color-->'>\n\t\t\t<th>{Column Title}</th>\n\t\t\t<th>{Column Title}</th>\n\t\t\t<th>{Column Title}</th>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>{cell content}</td>\n\t\t\t<td>{cell content}</td>\n\t\t\t<td>{cell content}</td>\n\t\t</tr>\n\t</table>\n\t<footer class='w3-container w3-white w3-padding-16'>\n\t\t<p class='w3-right w3-small'>{Author and data of creation}</p>\n\t</footer>\n</section>\n\n<!-- News 1 -->\n<section class='w3-row-padding w3-content w3-padding-32' style='max-width:1400px' id='{title}News'>\n\t<div class='w3-twothird'>\n\t\t<figure class='w3-margin-0'>\n\t\t\t<img src='image/image.webp' alt='{altImage}' style='width:100%'>\n\t\t\t<figcaption class='w3-small'>{Figure caption}</figcaption>\n\t\t</figure>\n\t\t<header>\n\t\t\t<h2 class='w3-text-<!--theme-color-->'>{News Title}</h2>\n\t\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{News Subtitle}</h3>\n\t\t</header>\n\t\t<div class='w3-justify w3-padding-16'>\n\t\t\t<p>{Introduction with 500 characters}</p>\n\t\t\t<p>{News with 500 characters}</p>\n\t\t\t<p>{Conclusion with 500 characters}</p>\n\t\t</div>\n\t\t<footer class='w3-container w3-white w3-padding-16' style='clear:both'>\n\t\t\t<p class='w3-right w3-small'>{Author and data of creation}</p>\n\t\t</footer>\n\t</div>\n\t<div class='w3-third'>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>{Title News}</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle news}</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>{text with 500 characters}</p>\n\t\t</div>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>{Title News}</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle news}</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>{text with 500 characters}</p>\n\t\t</div>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>{Title News}</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle news}</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>{text with 500 characters}</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- News 2 -->\n<section class='w3-row-padding w3-content w3-padding-32' style='max-width:1400px' id='{title}News'>\n\t<div class='w3-twothird'>\n\t\t{article}\n\t</div>\n\t<div class='w3-third'>\t\n\t\t<header>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>{Section Title}</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>{Section subtitle}</h4>\n\t\t</header>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>{Section Title}</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>{Section subtitle}</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>{Text with 500 characters}</p>\n\t\t</div>\n\t\t<br>\n\t\t<div class='w3-container w3-light-grey w3-justify'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>{Section Title}</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>{Section subtitle}</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>{Text with 500 characters}</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Card Template -->\n<div class='w3-card-4 w3-margin'>\n\t<img id='{title}CardsImage[number]' src='image/image.webp' alt='{altImage}' style='width:100%'>\n\t<div class='w3-container w3-center'>\n\t\t<h3 id='{title}CardsTitle[number]'>{Cards Title}</h3>\n\t\t<p id='{title}CardsSubtitle[number]'>{Cards Subtitle with 20 characters}</p>\n\t\t<p id='{title}CardsText[number]' class='w3-hide'>{Cards Text with 500 characters}</p>\n\t\t<p id='{title}CardsFooter[number]' class='w3-hide'>{Cards Footer with 20 characters}</p>\n\t</div>\n\t<button id='{title}CardButton[number]' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='{title}ModalCard(`[number]`)'>{Cards Button Text}</button>\n</div>\n\n<!-- Card Modal -->\n<section id='{title}Modal' class='w3-modal'>\n\t<div class='w3-modal-content'>\n\t  <header class='w3-container w3-<!--theme-color-->'> \n\t\t<span onclick='document.getElementById(`#{title}Modal`).style.display=`none`' class='w3-button w3-display-topright'>&times;</span>\n\t\t<h2 class='w3-text-<!--theme-color-->' id='{title}ModalHeader'></h2>\n\t  </header>\n\t  <div class='w3-container w3-padding-16' id='{title}ModalMain'>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity' id='{title}ModalSubtitle'></h4>\n\t\t\t<img src='image/image.webp' id='{title}ModalImage' style='max-width:200px;float:left;margin-right:8px'>\n\t\t\t<p id='{title}ModalText'></p>\n\t\t\t<br>\n\t  </div>\n\t  <footer class='w3-container w3-center w3-<!--theme-color-->' id='{title}ModalFooter'></footer>\n\t</div>\n</section>\n\n<!-- One Card -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Cards[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Card Section}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle card section}</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t{Card Template}\n\t</div>\n</section>\n\n<!-- Two Cards -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Cards[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Card Section}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle card section}</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-half'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-half'>\n\t\t\t{Card Template}\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Three Cards -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Cards[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Card Section}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle card section}</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-third'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-third'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-third'>\n\t\t\t{Card Template}\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Four Cards -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Cards[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Card Section}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Subtitle card section}</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-quarter'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t{Card Template}\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t{Card Template}\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Tabs -->\n<section class='w3-container w3-padding-32 w3-white' id='{title}Tabs[number]'>\n\t<header class='w3-container'>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Tabs Header}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{Text about tabs content}</h3>\n\t</header>\t\n\t<div class='w3-bar w3-<!--theme-color-->'>\n\t\t<button class='w3-bar-item w3-button' onclick='{title}Tabs[number](`[number]`)'>{Tab Title}</button>\n\t\t<button class='w3-bar-item w3-button' onclick='{title}Tabs[number](`[number]`)'>{Tab Title}</button>\n\t\t<button class='w3-bar-item w3-button' onclick='{title}Tabs[number](`[number]`)'>{Tab Title}</button>\n\t</div>\n\t<div id='{{title}Tab[number]}' class='w3-container {title}Tab[number] w3-show'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>{Tab Title}</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>{Tab subtitle}</h4>\n\t\t</header>\n\t\t<p>{Tab Content}</p>\n\t</div>\n\t<div id='{{title}Tab[number]}' class='w3-container {title}Tab[number] w3-hide'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>{Tab Title}</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>{Tab subtitle}</h4>\n\t\t</header>\n\t\t<p>{Tab Content}</p>\n\t</div>\n\t<div id='{{title}Tab[number]}' class='w3-container {title}Tab[number] w3-hide'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>{Tab Title}</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>{Tab subtitle}</h4>\n\t\t</header>\n\t\t<p>{Tab Content}</p>\n\t</div>\n</section>\n\n<!-- Accordions -->\n<section class='w3-container w3-white w3-padding-32' id='{title}Accordions[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Accordions}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{General text about accordions content with 300 character}</h3>\n\t</header>\n\t<button onclick='{title}Accordions(`[number]`)' class='w3-btn w3-block w3-<!--theme-color--> w3-left-align'>{Title Accordion}</button>\n\t<div id='{title}Accordion[number]' class='w3-container w3-hide'>\n\t  <h4 class='w3-text-<!--theme-color-->'>{Accordion title}</h4>\n\t  <h5 class='w3-text-<!--theme-color--> w3-opacity'>{Accordion subtitle}</h5>\n\t  <p>{Accordion content}</p>\n\t</div>\n\t<button onclick='{title}Accordions(`[number]`)' class='w3-btn w3-block w3-<!--theme-color--> w3-left-align'>{Title Accordion}</button>\n\t<div id='{title}Accordion[number]' class='w3-container w3-hide'>\n\t  <h4 class='w3-text-<!--theme-color-->'>{Accordion title}</h4>\n\t  <h5 class='w3-text-<!--theme-color--> w3-opacity'>{Accordion title}</h5>\n\t  <p>{Accordion content}</p>\n\t</div>\n\t<button onclick='{title}Accordions(`[number]`)' class='w3-btn w3-block w3-<!--theme-color--> w3-left-align'>{Title Accordion}</button>\n\t<div id='{title}Accordion[number]' class='w3-container w3-hide'>\n\t  <h4 class='w3-text-<!--theme-color-->'>{Accordion title}</h4>\n\t  <h5 class='w3-text-<!--theme-color--> w3-opacity'>{Accordion title}</h5>\n\t  <p>{Accordion content}</p>\n\t</div>\n</section>\n\n<!-- Galery Slide -->\n<section class='w3-container w3-white w3-padding-32' id='{title}GalerySlide[number]'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>{Title Galery}</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>{General text about galery with 300 character}</h3>\n\t</header>\n\t<div class='w3-content w3-display-container'>\n\t\t<img class='{title}Slides[number]' src='image/image.webp' style='width:100%'>\n\t\t<img class='{title}Slides[number]' src='image/image.webp' style='width:100%'>\n\t\t<img class='{title}Slides[number]' src='image/image.webp' style='width:100%'>\n\t\t<img class='{title}Slides[number]' src='image/image.webp' style='width:100%'>\n\t\t<button class='w3-button w3-black w3-display-left' onclick='{title}PlusDivs[number](-1)'>&#10094;</button>\n\t\t<button class='w3-button w3-black w3-display-right' onclick='{title}PlusDivs[number](1)'>&#10095;</button>\n\t</div>\n</section>\n\n<!-- Forms and Fields -->\n<section class='w3-container w3-margin-top w3-padding-32' id='{title}Form'>\n\t<fieldset class='w3-border-<!--theme-color--> w3-container w3-card-4'>\n\t\t<legend class='w3-<!--theme-color--> w3-xlarge w3-center' style='width:100%'>{Form Title}</legend>\n\t\t<form id='{title}Form' onsubmit='return {title}Send(this)' method='post'>\n\t\t\t<!-- input -->\n\t\t\t<p>\n\t\t\t\t<input class='w3-input' type='text' id='{titleFieldName}'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='{titleFieldName}'>{Field Name}</label>\n\t\t\t</p>\n\t\t\t<!-- input type radio or checkbox horizontal -->\n\t\t\t<p class='w3-third w3-text-<!--theme-color-->'>{Field Name}</p>\n\t\t\t<p class='w3-third'><input class='w3-{radio|checkbox}' type='{radio|checkbox}' name='{titleFieldName}' value='{value}'><label>{name}</label></p>\n\t\t\t<p class='w3-third'><input class='w3-{radio|checkbox}' type='{radio|checkbox}' name='{titleFieldName}' value='{value}'><label>{name}</label></p>\t\t\t\n\t\t\t<!-- input type radio or checkbox vertical -->\n\t\t\t<p class='w3-text-<!--theme-color-->'>{Field Name}</p>\n\t\t\t<p><input class='w3-{radio|checkbox}' type='{radio|checkbox}' name='{titleFieldName}' value='{value}'><label>{name}</label></p>\n\t\t\t<p><input class='w3-{radio|checkbox}' type='{radio|checkbox}' name='{titleFieldName}' value='{value}'><label>{name}</label></p>\n\t\t\t<!-- textarea -->\n\t\t\t<p>\n\t\t\t\t<textarea class='w3-input'  id='{titleFieldName}'></textarea>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='{titleFieldName}'>{Field Name}</label>\n\t\t\t</p>\n\t\t\t<!-- select -->\n\t\t\t<p>\n\t\t\t\t<select class='w3-select' id='{titleFieldName}'>\n\t\t\t\t\t<optgroup label='{Option Group Name}'>\n\t\t\t\t\t\t<option value='{optionValue}'>{Option Name}</option>\n\t\t\t\t\t</optgroup>\n\t\t\t\t</select>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='{titleFieldName}'>{Field Name}</label>\n\t\t\t</p>\t\t\n\t\t\t<!-- Two filds to line model -->\n\t\t\t<p class='w3-half'>\n\t\t\t\t{Field One}\n\t\t\t</p>\n\t\t\t<p class='w3-half'>\n\t\t\t\t{Field Two}\n\t\t\t</p>\n\t\t\t<!-- Three input line model -->\n\t\t\t<p class='w3-third'>\n\t\t\t\t{Field One}\n\t\t\t</p>\n\t\t\t<p class='w3-third'>\n\t\t\t\t{Field Two}\n\t\t\t</p>\n\t\t\t<p class='w3-third'>\n\t\t\t\t{Field Three}\n\t\t\t</p>\n\t\t\t<!-- Four input line model -->\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t{Field One}\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t{Field Two}\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t{Field Three}\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t{Field Four}\n\t\t\t</p>\n\t\t\t<!-- button -->\n\t\t\t<p class='w3-center'>\n\t\t\t\t<button type='submit' class='w3-button w3-section w3-<!--theme-color--> w3-ripple' style='width:100%'> Send </button>\n\t\t\t</p>\t\n\t\t</form>\n\t</fieldset>\n</section>\n\n<!--Footer-->\n<section class='w3-container w3-center w3-<!--theme-color-->' id='{title}Footer'>\n  <h4>{Title Footer}</h4>\n  <p class='w3-small'>{Subtitle Footer}</p>\n</section>",
			"dad": "system"
		},		
		"templates": {
			"javascript": "//Test\n\n//Test Modal Cards\nfunction testModalCard(number){\n\t$('#testModalHeader').innerHTML=$('#testCardButton'+number).innerText;\n\t$('#testModalSubtitle').innerHTML=$('#testCardsTitle'+number).innerHTML+': '+$('#testCardsSubtitle'+number).innerHTML;\n\t$('#testModalText').innerHTML=$('#testCardsText'+number).innerHTML;\n\t$('#testModalFooter').innerHTML=$('#testCardsFooter'+number).innerHTML;\n\t$('#testModalImage').src=$('#testCardsImage'+number).src;\n\t$(`#testModal`).style.display=`block`;\n}\n\n//Test Tabs 0\nfunction testTabs0(number) {\n\tlet x = document.getElementsByClassName('testTab0');\n\tfor (let i = 0; i < x.length; i++)x[i].className = x[i].className.replace('w3-show','w3-hide');\n\t$('#testTab'+number).className = $('#testTab'+number).className.replace('w3-hide','w3-show');\n}\n\n//Test Accordions\nfunction testAccordions(number) {\n\taccordion = $('#testAccordion'+number).className;\n\t$('#testAccordion'+number).className = accordion.indexOf('w3-hide') > -1 ? accordion.replace('w3-hide','w3-show') : accordion.replace('w3-show','w3-hide') ;\n\t\n}\n\n//Test Galery Slide 0\nvar testSlideIndex0 = 1;\ntestShowDivs0(testSlideIndex0);\nfunction testPlusDivs0(n) {\n  testShowDivs0(testSlideIndex0 += n);\n}\nfunction testShowDivs0(n) {\n\tlet x = document.getElementsByClassName('testSlides0');\n\tif (n > x.length) {testSlideIndex0 = 1}\n\tif (n < 1) {testSlideIndex0 = x.length}\n\tfor (let i = 0; i < x.length; i++) x[i].style.display = 'none';\n\tx[testSlideIndex0-1].style.display = 'block';\n}\n\n//Test Send\nfunction testSend(e){\n\tdata = getData(e);\n\tconsole.log('Sended contact test');\n\tconsole.log(data);\n\treturn false;\n}",
			"dad": "system",
			"html": "<!-- Header -->\n<section class='w3-panel w3-white w3-center w3-padding-64' id='testHeader'>\n\t<h1 class='w3-text-<!--theme-color--> w3-bold'>Teste Header</h1>\n\t<h2 class='w3-text-<!--theme-color--> w3-opacity'>This is a test header</h2>\n</section>\n\t\n<!-- Fullbanner Header -->\n<section class='w3-display-container' id='testFullbannerHeader'>\n\t<img src='https://www.w3schools.com/w3css/img_mountains.jpg' alt='Mountains' style='width:100%'>\n\t<div class='w3-padding w3-display-middle'>\n\t\t<div class='w3-center'>\n\t\t\t<h1 class='w3-text-white w3-bold w3-shadow'>Teste Fullbanner Header</h1>\n\t\t\t<p class='w3-large w3-text-white w3-opacity w3-shadow'>This is a test fullbanner header</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Article -->\n<section class='w3-container w3-white w3-padding-32' id='testArticle0'>\n\t<article>\n\t\t<header>\n\t\t\t<h2 class='w3-text-<!--theme-color-->'>Test Article</h2>\n\t\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>This is a test article.</h3>\n\t\t</header>\n\t\t<figure style='width:33%;float:left;margin:8px'>\n\t\t\t<img src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t<figcaption class='w3-tiny'>This is a test image.</figcaption>\n\t\t</figure>\n\t\t<div class='w3-justify' style='padding-left:16px'>\n\t\t\t<p>This is a test introduction. It's a short paragraph with some basic information about the topic. It provides context and sets the stage for the main content.</p>\n\t\t\t<p>This is a test news paragraph. It delves into the main topic, presenting key facts, details, and insights. It's engaging and informative, keeping the reader interested.</p>\n\t\t\t<p>This is a test conclusion. It summarizes the main points, offers insights, and leaves a lasting impression on the reader. It's concise and impactful.</p>\n\t\t</div>\n\t\t<footer class='w3-container w3-white w3-padding-16' style='clear:both'>\n\t\t\t<p class='w3-right w3-small'>Author: John Doe - Date: 2023-10-26</p>\n\t\t</footer>\n\t</article>\n</section>\n\n<!-- Tables -->\n<section class='w3-container w3-white w3-padding-32' id='testTable0'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Test Table</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>This is a table with five registers</h3>\n\t</header>\n\t<table class='w3-table-all w3-hoverable w3-card w3-small'>\n\t\t<tbody><tr class='w3-<!--theme-color-->'>\n\t\t\t<th>Column 1</th>\n\t\t\t<th>Column 2</th>\n\t\t\t<th>Column 3</th>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Register 1</td>\n\t\t\t<td>Register 1</td>\n\t\t\t<td>Register 1</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Register 2</td>\n\t\t\t<td>Register 2</td>\n\t\t\t<td>Register 2</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Register 3</td>\n\t\t\t<td>Register 3</td>\n\t\t\t<td>Register 3</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Register 4</td>\n\t\t\t<td>Register 4</td>\n\t\t\t<td>Register 4</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td>Register 5</td>\n\t\t\t<td>Register 5</td>\n\t\t\t<td>Register 5</td>\n\t\t</tr>\n\t</tbody></table>\n\t<footer class='w3-container w3-white w3-padding-16'>\n\t\t<p class='w3-right w3-small'>Author and data of creation</p>\n\t</footer>\n</section>\n\n<!-- News 1 -->\n<section class='w3-row-padding w3-content w3-padding-32' style='max-width:1400px' id='testNews'>\n\t<div class='w3-twothird'>\n\t\t<figure class='w3-margin-0'>\n\t\t\t<img src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t<figcaption class='w3-small'>Caption for image</figcaption>\n\t\t</figure>\n\t\t<header>\n\t\t\t<h2 class='w3-text-<!--theme-color-->'>News Title</h2>\n\t\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h3>\n\t\t</header>\n\t\t<div class='w3-justify w3-padding-16'>\n\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. </p>\n\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\t\n\t\t<footer class='w3-container w3-white w3-padding-16' style='clear:both'>\n\t\t\t<p class='w3-right w3-small'>Author and data of creation</p>\n\t\t</footer>\n\t</div>\n\t<div class='w3-third'>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>News Title</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\n\t\t<br>\n\t\t<div class='w3-container w3-light-grey w3-justify'>\t\t\t\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>News Title</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\n\t\t<br>\n\t\t<div class='w3-container w3-light-grey w3-justify'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>News Title</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- News 2 -->\n<section class='w3-row-padding w3-content w3-padding-32' style='max-width:1400px' id='testNews'>\n\t<div class='w3-twothird'>\n\t\t<article>\n\t\t\t<figure style='width:50%;float:left;margin:8px'>\n\t\t\t\t<img src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<figcaption class='w3-tiny'>Figure Caption</figcaption>\n\t\t\t</figure>\n\t\t\t<div class='w3-justify' style='padding-left:16px'>\n\t\t\t\t<header>\n\t\t\t\t\t<h2 class='w3-text-<!--theme-color-->'>News Title</h2>\n\t\t\t\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h3>\n\t\t\t\t</header>\n\t\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. </p>\n\t\t\t\t<p>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t\t</div>\n\t\t\t<footer class='w3-container w3-white w3-padding-16' style='clear:both'>\n\t\t\t\t<p class='w3-right w3-small'>Author and data of creation</p>\n\t\t\t</footer>\n\t\t</article>\n\t</div>\n\t<div class='w3-third'>\n\t\t<header>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>Section Name</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle section</h4>\n\t\t</header>\n\t\t<div class='w3-container w3-light-grey'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>News Title</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\n\t\t<br>\n\t\t<div class='w3-container w3-light-grey w3-justify'>\n\t\t\t<header>\n\t\t\t\t<h4 class='w3-text-<!--theme-color-->'>News Title</h4>\n\t\t\t\t<h5 class='w3-text-<!--theme-color--> w3-opacity'>Subtitle</h5>\n\t\t\t</header>\n\t\t\t<p class='w3-justify'>This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template. This is a test news to test news template.</p>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Cards -->\n<section id='testModal' class='w3-modal' style='display: none;'>\n\t<div class='w3-modal-content'>\n\t  <header class='w3-container w3-<!--theme-color-->'> \n\t\t<span onclick='document.getElementById(`testModal`).style.display=`none`' class='w3-button w3-display-topright'>×</span>\n\t\t<h2 id='testModalHeader'>Card Button Text</h2>\n\t  </header>\n\t  <div class='w3-container w3-padding-16' id='testModalMain'>\n\t\t\t<h4 id='testModalSubtitle'>Card Title: Card Subtitle</h4>\n\t\t\t<img src='https://www.w3schools.com/w3css/img_lights.jpg' id='testModalImage' style='max-width:200px;float:left;margin-right:8px'>\n\t\t\t<p id='testModalText'>Card Text with 500 characters</p>\n\t  </div>\n\t  <footer class='w3-container w3-center w3-<!--theme-color-->' id='testModalFooter'>Card Footer</footer>\n\t</div>\n</section>\n<section class='w3-container w3-white w3-padding-32' id='testCards9'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>One Card</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Show one card</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t<img id='testCardsImage9' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t<h3 id='testCardsTitle9'>Card Title</h3>\n\t\t\t\t<p id='testCardsSubtitle9'>Card Subtitle</p>\n\t\t\t\t<p id='testCardsText9' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t<p id='testCardsFooter9' class='w3-hide'>Card Footer</p>\n\t\t\t</div>\n\t\t\t<button id='testCardButton9' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`9`)'>Card Button Text</button>\n\t\t</div>\n\t</div>\n</section>\n<section class='w3-container w3-white w3-padding-32' id='testCards0'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Two Cards</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Show two cards</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-half'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage0' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle0'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle0'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText0' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter0' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton0' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`0`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-half'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage1' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle1'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle1'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText1' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter1' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton1' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`1`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</section>\n<section class='w3-container w3-white w3-padding-32' id='testCards1'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Three Cards</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Show three cards</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-third'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage2' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle2'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle2'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText2' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter2' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton2' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`2`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-third'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage3' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle3'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle3'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText3' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter3' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton3' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`3`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-third'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage4' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle4'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle4'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText4' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter4' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton4' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`4`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</section>\n<section class='w3-container w3-white w3-padding-32' id='testCards2'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Four Cards</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Show four cards</h3>\n\t</header>\n\t<div class='w3-row-padding w3-center'>\n\t\t<div class='w3-quarter'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage5' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle5'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle5'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText5' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter5' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton5' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`5`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage6' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle6'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle6'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText6' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter6' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton6' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`6`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage7' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle7'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle7'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText7' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter7' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton7' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`7`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t\t<div class='w3-quarter'>\n\t\t\t<div class='w3-card-4 w3-margin'>\n\t\t\t\t<img id='testCardsImage8' src='https://www.w3schools.com/w3css/img_lights.jpg' alt='Lights' style='width:100%'>\n\t\t\t\t<div class='w3-container w3-center'>\n\t\t\t\t\t<h3 id='testCardsTitle8'>Card Title</h3>\n\t\t\t\t\t<p id='testCardsSubtitle8'>Card Subtitle</p>\n\t\t\t\t\t<p id='testCardsText8' class='w3-hide'>Card Text with 500 characters</p>\n\t\t\t\t\t<p id='testCardsFooter8' class='w3-hide'>Card Footer</p>\n\t\t\t\t</div>\n\t\t\t\t<button id='testCardButton8' class='w3-button w3-<!--theme-color-->' style='width:100%' onclick='testModalCard(`8`)'>Card Button Text</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</section>\n\n<!-- Tabs -->\n<section class='w3-container w3-mpadding-32 w3-white' id='testTabs0'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>About Us</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>Learn more about our company and our mission.</h3>\n\t</header>\n\t\t<div class='w3-bar w3-<!--theme-color-->'>\n\t\t<button class='w3-bar-item w3-button' onclick='testTabs0(`0`)'>History</button>\n\t\t<button class='w3-bar-item w3-button' onclick='testTabs0(`1`)'>Mission</button>\n\t\t<button class='w3-bar-item w3-button' onclick='testTabs0(`2`)'>Values</button>\n\t</div>\n\t<div id='testTab0' class='w3-container testTab0 w3-show'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>History</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>Discover our history</h4>\n\t\t</header>\n\t\t<p>Our company was founded in 2000 with the goal of providing innovative solutions to our customers. We have a long history of success and we are committed to continued growth and innovation.</p>\n\t</div>\n\t<div id='testTab1' class='w3-container testTab0 w3-hide'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>Mission</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>Learn about our mission</h4>\n\t\t</header>\n\t\t<p>Our mission is to provide our customers with the highest quality products and services. We are committed to exceeding our customer's expectations and building long-lasting relationships.</p>\n\t</div>\n\t<div id='testTab2' class='w3-container testTab0 w3-hide'>\n\t\t<header class='w3-container'>\n\t\t\t<h3 class='w3-text-<!--theme-color-->'>Values</h3>\n\t\t\t<h4 class='w3-text-<!--theme-color--> w3-opacity'>Know our values</h4>\n\t\t</header>\n\t\t<p>Our values are the foundation of our company. We believe in integrity, honesty, and respect for our employees and customers.</p>\n\t</div>\n</section>\n\n<!-- Accordions -->\n<section class='w3-container w3-white w3-padding-32' id='testAccordions0'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Our Services</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>We offer a wide range of services to meet your needs.</h3>\n\t</header>\n\t<button onclick='testAccordions(`0`)' class='w3-btn w3-block w3-<!--theme-color--> w3-left-align'>Web Development</button>\n\t<div id='testAccordion0' class='w3-container w3-hide'>\n\t  <h4 class='w3-text-<!--theme-color-->'>Web Development</h4>\n\t  <h5 class='w3-text-<!--theme-color--> w3-opacity'>Discover our website technology</h5>\n\t  <p>We offer a wide range of web development services, including website design, development, and maintenance. We work with businesses of all sizes to create custom websites that meet their unique needs.</p>\n\t</div>\n\t<button onclick='testAccordions(`1`)' class='w3-btn w3-block w3-<!--theme-color--> w3-left-align'>Mobile App Development</button>\n\t<div id='testAccordion1' class='w3-container w3-hide'>\n\t  <h4 class='w3-text-<!--theme-color-->'>Mobile App Development</h4>\n\t  <h5 class='w3-text-<!--theme-color--> w3-opacity'>An app specially developed for your company</h5>\n\t  <p>We also offer mobile app development services. We create native iOS and Android apps that are user-friendly and engaging. </p>\n\t</div>\n</section>\n\n<!-- Galery Slide -->\n<section class='w3-container w3-white w3-padding-32' id='testGalerySlide0'>\n\t<header>\n\t\t<h2 class='w3-text-<!--theme-color-->'>Image Gallery</h2>\n\t\t<h3 class='w3-text-<!--theme-color--> w3-opacity'>A collection of images from our latest projects.</h3>\n\t</header>\n\t<div class='w3-content w3-display-container'>\n\t\t<img class='testSlides0' src='https://www.w3schools.com/w3css/img_lights.jpg' style='width:100%'>\n\t\t<img class='testSlides0' src='https://www.w3schools.com/w3css/img_mountains.jpg' style='width:100%'>\n\t\t<img class='testSlides0' src='https://www.w3schools.com/w3css/img_forest.jpg' style='width:100%'>\n\t\t<img class='testSlides0' src='https://www.w3schools.com/w3css/img_snow.jpg' style='width:100%'>\n\t\t<button class='w3-button w3-black w3-display-left' onclick='testPlusDivs0(-1)'>&#10094;</button>\n\t\t<button class='w3-button w3-black w3-display-right' onclick='testPlusDivs0(1)'>&#10095;</button>\n\t</div>\n</section>\n\n<!-- Forms and Fields -->\n<section class='w3-container w3-margin-top w3-padding-32' id='testForm'>\n\t<fieldset class='w3-border-<!--theme-color--> w3-container w3-card-4'>\n\t\t<legend class='w3-<!--theme-color--> w3-xlarge w3-center' style='width:100%'> Contact Us </legend>\n\t\t<form id='testForm' onsubmit='return testSend(this)' method='post'>\n\t\t\t<p>\n\t\t\t\t<input class='w3-input' type='text' id='testName'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testName'>Your Name</label>\n\t\t\t</p>\n\t\t\t<p>\n\t\t\t\t<input class='w3-input' type='email' id='testEmail'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testEmail'>Your Email</label>\n\t\t\t</p>\n\t\t\t<p>\n\t\t\t\t<input class='w3-input' type='tel' id='testPhone'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testPhone'>Your Phone</label>\n\t\t\t</p>\n\t\t\t<p class='w3-text-<!--theme-color-->'>Select your preferred contact method</p>\n\t\t\t<p><input class='w3-radio' type='radio' name='testContactMethod' value='Email'><label>Email</label></p>\n\t\t\t<p><input class='w3-radio' type='radio' name='testContactMethod' value='Phone'><label>Phone</label></p>\n\t\t\t<p>\n\t\t\t\t<textarea class='w3-input'  id='testMessage'></textarea>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testMessage'>Your Message</label>\n\t\t\t</p>\n\t\t\t<p>\n\t\t\t\t<select class='w3-select' id='testSubject'>\n\t\t\t\t\t<optgroup label='Subjects'>\n\t\t\t\t\t\t<option value='General Inquiry'>General Inquiry</option>\n\t\t\t\t\t\t<option value='Project Inquiry'>Project Inquiry</option>\n\t\t\t\t\t\t<option value='Feedback'>Feedback</option>\n\t\t\t\t\t</optgroup>\n\t\t\t\t</select>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testSubject'>Subject</label>\n\t\t\t</p>\n\t\t\t<p class='w3-half'>\n\t\t\t\t<input class='w3-input' type='date' id='testDate'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testDate'>Date</label>\n\t\t\t</p>\n\t\t\t<p class='w3-half'>\n\t\t\t\t<input class='w3-input' type='time' id='testTime'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testTime'>Time</label>\n\t\t\t</p>\n\t\t\t<p class='w3-third'>\n\t\t\t\t<input class='w3-input' type='number' id='testNumber'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testNumber'>Number</label>\n\t\t\t</p>\n\t\t\t<p class='w3-third'>\n\t\t\t\t<input class='w3-input' type='range' id='testRange' min='1' max='10' step='1'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testRange'>Range</label>\n\t\t\t</p>\n\t\t\t<p class='w3-third'>\n\t\t\t\t<input class='w3-input' type='color' id='testColor'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testColor'>Color</label>\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t<input class='w3-input' type='file' id='testFile'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testFile'>File</label>\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t<input class='w3-input' type='password' id='testPassword'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testPassword'>Password</label>\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t<input class='w3-input' type='url' id='testUrl'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testUrl'>URL</label>\n\t\t\t</p>\n\t\t\t<p class='w3-quarter'>\n\t\t\t\t<input class='w3-input' type='search' id='testSearch'>\n\t\t\t\t<label class='w3-text-<!--theme-color-->' for='testSearch'>Search</label>\n\t\t\t</p>\n\t\t\t<p class='w3-center'>\n\t\t\t\t<button type='submit' class='w3-button w3-section w3-<!--theme-color--> w3-ripple' style='width:100%'> Send </button>\n\t\t\t</p>\n\t\t</form>\n\t</fieldset>\n</section>\n\n<!--Footer-->\n<section class='w3-container w3-center w3-<!--theme-color-->' id='testFooter'>\n\t<h4>Test Company</h4>\n\t<p class='w3-small'>Copyright &copy; 2023 Test. All Rights Reserved.</p>\n</section>",
			"name": "Templates",
			"hash": "templates",
			"module": "none",
			"credential": {
				"read": [
					"<!--super-user-->"
				],
				"menu": [],
				"write": [
					"<!--super-user-->"
				]
			}
		},
		"terms": {
			"name": "Terms",
			"javascript": "//terms",
			"hash": "terms",
			"html": "<section class='w3-container' id='terms'>\r\n\t<header>\r\n\t\t<h1 class='w3-text-<!--theme-color-->'>MIT License</h1>\r\n\t\t<h2 class='w3-text-<!--theme-color--> w3-opacity'>Copyright (c) 2024 <!--project-name--></h2>\r\n\t</header>\r\n\t<p class='w3-justify'>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>\r\n\t<p class='w3-justify'>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>\r\n\t<p class='w3-justify'>THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>\r\n</section>",
			"module": "none",
			"credential": {
				"menu": [
					"<!--super-user-->"
				],
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"dad": "pages"
		},
		"users": {
			"dad": "admin",
			"module": "none",
			"html": "<article class='w3-container' id='users'>\n\t<h3 class='w3-container'>\n\t\tUsers\n\t</h3>\n\t\n\t<!--List-->\n\t<table class='w3-table-all w3-hoverable w3-card'>\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t<th class='w3-w'>Group</th>\n\t\t\t\t<th>Name</th>\n\t\t\t\t<th class='w3-w'>E-mail</th>\n\t\t\t\t<th class='w3-right'>\n\t\t\t\t\t<button class='w3-btn w3-deep-orange w3-right w3-tiny w3-round w3-e' id='usersBtnFilter'>\n\t\t\t\t\t\t<span class='w3-w'>Filter</span>\n\t\t\t\t\t\t<span class='w3-y'>F</span>\n\t\t\t\t\t</button>\n\t\t\t\t\t<button class='w3-btn w3-green w3-right w3-tiny w3-round w3-e' id='usersBtnNew'>\n\t\t\t\t\t\t<span class='w3-w'>New</span>\n\t\t\t\t\t\t<span class='w3-y'>N</span>\n\t\t\t\t\t</button>\n\t\t\t\t</th>\n\t\t\t</tr><tr>\n\t\t\t\t<td class='w3-padding-0' colspan='4'>\n\t\t\t\t\t<span class='w3-hide w3-center' id='usersFilter'>\n\t\t\t\t\t\t<select class='w3-input' id='usersFilterGroup'></select>\n\t\t\t\t\t\t<input class='w3-input' id='usersFilterName' placeholder='&#9655; Name &#9665;' type='text'>\n\t\t\t\t\t</span>\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t</thead>\n\t\t<tbody id='usersList'>\n\t\t</tbody>\n\t</table>\n\t\n\t<!--Edit-->\n\t<section class='w3-modal' id='usersEdit'>\n\t\t<div class='w3-modal-content w3-round'>\n\t\t\t<div class='w3-container'>\n\t\t\t\t<button class='w3-btn w3-round w3-red w3-display-topright w3-tiny' id='usersEditClose'>\n\t\t\t\t\t<b>&times;</b>\n\t\t\t\t</button>\n\t\t\t\t<form class='w3-container w3-padding-16' id='usersEditData'>\n\t\t\t\t\t<fieldset class='w3-round w3-border-<!--theme-color-->'>\n\t\t\t\t\t\t<legend class='w3-container w3-large w3-text-<!--theme-color--> w3-padding'>User</legend>\n\t\t\t\t\t\t<label class='w3-text-blue'>Group</label>\n\t\t\t\t\t\t<select class='w3-input' id='usersEditGroup' name='usersEditGroup' required></select>\n\t\t\t\t\t\t<label class='w3-text-blue'>Name</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='name' id='usersEditName' name='usersEditName' placeholder='name' type='text' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>E-mail</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='email' id='usersEditEmail' name='usersEditEmail' placeholder='e-mail' type='email' pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$' required>\n\t\t\t\t\t\t<label class='w3-text-blue'>Password</label>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='usersEditPassword' name='usersEditPassword' placeholder='Password' minlength='6' type='password'>\n\t\t\t\t\t\t<input class='w3-input' autocomplete='new-password' id='usersEditCheck' name='usersEditCheck' placeholder='Repeat password' minlength='6' type='password'>\n\t\t\t\t\t\t<p class='w3-center w3-hide w3-show' id='usersEditBtn'>\n\t\t\t\t\t\t\t<button class='w3-btn w3-red w3-round' id='usersEditCancel' type='button'>Cancel</button>\n\t\t\t\t\t\t\t<button class='w3-btn w3-blue w3-round' id='usersEditSave'>Save</button>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t\t<p class='w3-center w3-hide' id='usersEditLoad'>\n\t\t\t\t\t\t\t<img src='load.gif' alt='load' width='50'>\n\t\t\t\t\t\t</p>\n\t\t\t\t\t</fieldset>\n\t\t\t\t</form>\n\t\t\t</div>\n\t\t</div>\n\t</section>\t\n\t\n\t<section id='usersLoad' class='w3-modal w3-animate-opacity w3-show'>\n\t\t<img class='w3-display-middle' src='load.gif'>\n\t</section>\n\t\n</article>",
			"javascript": "users.User={};\nusers.Users={};\nusers.Groups={};\n\nusers.filterTime;\n$('#usersFilterName').addEventListener('keyup',event=>{\n\tclearTimeout(users.filterTime);\n\tfilterTime=setTimeout(users.list,400);\n});\n$('#usersBtnFilter').addEventListener('click',()=>flip('#usersFilter'));\n$('#usersFilterGroup').addEventListener('change',()=>users.list());\n\nread('groups',null,'hash').then(data=>{\t\n\tusers.Groups=Object.assign({},data);\n\tgroups='';\n\tfor(const id in users.Groups)groups+=`<option value='${id}'>${users.Groups[id].name}`;\n\t$('#usersEditGroup').innerHTML=`<option value=''>Select a group${groups}`;\n\t$('#usersFilterGroup').innerHTML=`<option value=''>All groups${groups}`;\n\tform('usersEdit',users.check);\n\thide('#usersLoad');\n});\t\n\n$('#usersBtnNew').addEventListener('click',()=>{\n\t$('#usersEditData').reset();\n\t$('#usersEditPassword').required=true;\n\t$('#usersEditCheck').required=true;\n\tusers.User=Object.assign({\n\t\t\"id\":\"0\",\n\t\t\"created\":new Date(),\n\t\t\"edited\":new Date(),\n\t\t\"deleted\":\"0\",\n\t\t\"hash\":\"\",\n\t\t\"group\":\"\",\n\t\t\"name\":\"\",\n\t\t\"email\":\"\",\n\t\t\"password\":\"\"\n\t});\n\tshow('#usersEdit');\n});\n\nusers.list=()=>{\n\tlet filter='deleted;==;0';\n\tfilter+=$('#usersFilterName').value!=''?`|hash;>=;${hash($('#usersFilterName').value)}`:'';\n\tfilter+=$('#usersFilterGroup').value!=''?`|group;==;${$('#usersFilterGroup').value}`:'';\n\tread('users',filter,'hash','20').then(data=>{\n\t\t$('#usersList').innerHTML='';\n\t\tif(data){\n\t\t\tusers.Users=Object.assign(data);\n\t\t\tfor(const id in data){\n\t\t\t\t$('#usersList').insertAdjacentHTML('beforeend',`<tr>\n\t\t\t\t\t<td class='w3-point'>${users.Groups[data[id].group].name}</td>\n\t\t\t\t\t<td class='w3-point'>${data[id].name}</td>\n\t\t\t\t\t<td class='w3-w'>${data[id].email}</td>\n\t\t\t\t\t<td class='w3-right'>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='usersEdit${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Edit</span>\n\t\t\t\t\t\t\t<span class='w3-y'>E</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t\t<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='usersDelete${id}'>\n\t\t\t\t\t\t\t<span class='w3-w'>Delete</span>\n\t\t\t\t\t\t\t<span class='w3-y'>D</span>\n\t\t\t\t\t\t</button>\n\t\t\t\t\t</td>\n\t\t\t\t</tr>`);\n\t\t\t\t$(\"#usersEdit\"+id).addEventListener('click',()=>{\n\t\t\t\t\tusers.User=Object.assign({},users.Users[id]);\n\t\t\t\t\t$('#usersEditData').reset();\n\t\t\t\t\t$('#usersEditPassword').required=false;\n\t\t\t\t\t$('#usersEditCheck').required=false;\n\t\t\t\t\t$('#usersEditGroup').value=users.User.group;\n\t\t\t\t\t$('#usersEditName').value=users.User.name;\n\t\t\t\t\t$('#usersEditEmail').value=users.User.email;\n\t\t\t\t\tshow('#usersEdit');\n\t\t\t\t});\n\t\t\t\t$(\"#usersDelete\"+id).addEventListener('click',()=>{\n\t\t\t\t\tif(confirm('Do you really want to delete the user?')){\n\t\t\t\t\t\tshow('#usersLoad');\n\t\t\t\t\t\tusers.Users[id].deleted=new Date();\n\t\t\t\t\t\twrite('users',users.Users[id],id).then(()=>{\n\t\t\t\t\t\t\tread(`users/${user.uid}`).then(adm=>{\n\t\t\t\t\t\t\t\tusers.email=adm.email;\n\t\t\t\t\t\t\t\tusers.password=adm.password;\n\t\t\t\t\t\t\t\tAuth.signInWithEmailAndPassword(users.Users[id].email,users.Users[id].password).then(()=>Auth.currentUser.delete().then(()=>Auth.signInWithEmailAndPassword(users.email,users.password).then(()=>{\n\t\t\t\t\t\t\t\t\tusers.email=null;\n\t\t\t\t\t\t\t\t\tusers.password=null;\n\t\t\t\t\t\t\t\t\tusers.list();\n\t\t\t\t\t\t\t\t\thide('#usersLoad');\n\t\t\t\t\t\t\t\t\tmodal('Success','User deleted successfully','green');\n\t\t\t\t\t\t\t\t})));\n\t\t\t\t\t\t\t});\t\n\t\t\t\t\t\t});\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t}\n\t\t}else{\n\t\t\t$('#usersList').innerHTML=\"<tr id='usersLoad'><td colspan='4' class='w3-center'>Empty</td></tr>\";\n\t\t}\n\t});\t\n}\nusers.list();\n\nusers.check=data=>{\n\tshow('#usersEditLoad');\n\thide('#usersEditBtn');\n\tif(users.User.id=='0'&&data.password!=data.check){\n\t\tmodal('Caution','Password checks must equal password','yellow');\n\t\tshow('#usersEditBtn');\n\t\thide('#usersEditLoad');\n\t\treturn false;\n\t}\n\tif(users.User.id=='0'||(users.User.id!='0'&&users.User.email!=data.email)){\n\t\tAuth.fetchSignInMethodsForEmail(data.email).then(obj=>{\n\t\t\tif(obj[0]){\n\t\t\t\tmodal('Caution','User already exists','yellow');\n\t\t\t\tshow('#usersEditBtn');\n\t\t\t\thide('#usersEditLoad');\n\t\t\t}else{\n\t\t\t\tusers.change(data);\n\t\t\t}\n\t\t});\n\t}else{\n\t\tusers.change(data);\n\t}\n}\n\nusers.change=data=>{\n\tread(`users/${user.uid}`).then(adm=>{\n\t\tusers.email=adm.email;\n\t\tusers.password=adm.password;\n\t\tif(users.User.id=='0'){\n\t\t\tAuth.createUserWithEmailAndPassword(data.email,data.password).then(()=>{\n\t\t\t\tusers.User.id=Auth.currentUser.uid;\n\t\t\t\tAuth.currentUser.updateProfile({displayName:users.User.group,photoURL:users.Groups[data.group].hash}).then(()=>Auth.signInWithEmailAndPassword(users.email,users.password).then(()=>users.save(data)));\n\t\t\t});\n\t\t}else{\n\t\t\tAuth.signInWithEmailAndPassword(users.User.email,users.User.password).then(()=>Auth.currentUser.updateProfile({displayName:data.group,photoURL:users.Groups[data.group].hash}).then(()=>Auth.currentUser.updateEmail(data.email).then(()=>Auth.currentUser.updatePassword(data.password==''?users.User.password:data.password).then(()=>Auth.signInWithEmailAndPassword(users.email,users.password).then(()=>users.save(data))))));\n\t\t}\n\t});\n}\n\nusers.save=data=>{\n\tusers.email=null;\n\tusers.password=null;\n\tusers.User.edited=new Date();\n\tusers.User.name=data.name;\n\tusers.User.hash=hash(data.name);\n\tusers.User.group=data.group;\n\tusers.User.email=data.email;\n\tif(data.password!='')users.User.password=data.password;\n\twrite('users',users.User,users.User.id).then(()=>{\n\t\tusers.list();\n\t\tshow('#usersEditBtn');\n\t\thide('#usersEditLoad');\n\t\thide('#usersEdit');\n\t\tmodal('Success','User created','green');\n\t});\n}\n",
			"name": "Users",
			"credential": {
				"menu": [],
				"read": [
					"<!--super-user-->"
				],
				"write": [
					"<!--super-user-->"
				]
			},
			"hash": "users"
		}
	},
	"groups": {
		"<!--common-->": {
			"hash": "common",
			"boss": "none",
			"name": "Common",
			"id": "<!--common-->"
		},
		"<!--super-user-->": {
			"name": "Super user",
			"hash": "super-user",
			"boss": "none",
			"id": "<!--super-user-->"
		}
	},
	"users": {
		"<!--user-id-->": {
			"email": "<!--email-->",
			"group": "<!--super-user-->",
			"password": "<!--password-->",
			"name": "Super User",
			"edited": "<!--date-now-->",
			"created": "<!--date-now-->",
			"deleted": "0",
			"id": "<!--user-id-->",
			"hash": "super-user"
		}
	}
};

clone.manifest = {
	"short_name": "webpow",
	"name": "webpow",
	"description": "webpow, Created by WebPoW",
	"icons": [
		{
			"src": "logo180.png",
			"type": "image/png",
			"sizes": "180x180"
		},
		{
			"src": "logo512.png",
			"type": "image/png",
			"sizes": "512x512"
		},
		{
			"src": "logo256.png",
			"type": "image/png",
			"sizes": "256x256",
			"purpose": "any maskable"
		}
	],
	"id": "/index.html",
	"start_url": "/index.html",
	"background_color": "#FFFFFF",
	"theme_color": "#673AB7",
	"display": "fullscreen",
	"gcm_sender_id": "103953800507"
};

clone.html=`<!DOCTYPE html>
<html lang='pt-br'>
	<head>
		<meta charset='UTF-8'>
		<title><!--title--></title>
		<meta name='description' content='<!--description-->'>
		<meta name='keywords' content='<!--keywords-->'>
		<meta name='author' content='<!--author-->'>
		<meta name='reply-to' content='<!--reply-->'>
		<meta name='generator' content='WebPow'>
		<meta name='viewport' content='width=device-width, initial-scale=1.0'>		
		<meta name='theme-color' content='<!--themeHex-->'>
		<link rel='manifest' href='manifest.json'>
		<link rel='apple-touch-icon' href='logo180.png'>
		<link rel='preconnect' href='https://www.gstatic.com/'>
		<link rel='preconnect' href='https://firebaseinstallations.googleapis.com'>
		<link rel='shortcut icon' href='favicon.ico'>
		<link rel='stylesheet' href='https://www.w3schools.com/w3css/4/w3.css'>
		<link rel='stylesheet' href='pow.css'>
	</head>
	<body class='w3-<!--background-->'>
		<header class='w3-bar w3-<!--theme-->'></header>
		<main class='w3-animate-opacity'></main>
		<footer></footer>
		<script src='https://www.gstatic.com/firebasejs/8.6.3/firebase-app.js'></script>
		<script src='https://www.gstatic.com/firebasejs/8.6.3/firebase-auth.js'></script>
		<script src='https://www.gstatic.com/firebasejs/8.6.3/firebase-firestore.js'></script>
		<script src='https://www.gstatic.com/firebasejs/8.6.3/firebase-analytics.js'></script>
		<script src='connect.js'></script>
		<script src='pow.js'></script>
	</body>
</html>`;

//clone color
clone.cor=new Array();
clone.cor['red']='#f44336';
clone.cor['pink']='#e91e63';
clone.cor['purple']='#9c27b0';
clone.cor['deep-purple']='#673ab7';
clone.cor['indigo']='#3f51b5';
clone.cor['blue']='#2196F3';
clone.cor['light-blue']='#87ceeb';
clone.cor['cyan']='#00bcd4';
clone.cor['aqua']='#00ffff';
clone.cor['teal']='#009688';
clone.cor['green']='#4caf50';
clone.cor['light-green']='#8bc34a';
clone.cor['lime']='#cddc39';
clone.cor['sand']='#fdf5e6';
clone.cor['khaki']='#f0e68c';
clone.cor['yellow']='#ffeb3b';
clone.cor['amber']='#ffc107';
clone.cor['orange']='#ff9800';
clone.cor['deep-orange']='#ff5722';
clone.cor['blue-gray']='#607d8b'; 
clone.cor['brown']='#795548';
clone.cor['light-gray']='#f1f1f1';
clone.cor['gray']='#9e9e9e';
clone.cor['dark-gray']='#616161';
clone.cor['pale-red']='#ffdddd';
clone.cor['pale-yellow']='#ffffcc';
clone.cor['pale-green']='#ddffdd';
clone.cor['pale-blue']='#ddffff'; 

cloneStart.addEventListener('click',()=>{
	if(!cloneData.checkValidity())return false;
	hide('#cloneBtn');
	show('#cloneLoad');
	
	clone.common = key();	
	clone.super_user = key();
	clone.date = new Date();
	
	//Fixed files
	clone.str2zip('emulators.bat','firebase emulators:start');
	clone.str2zip('deploy-functions.bat','firebase deploy --only functions');
	clone.str2zip('deploy-hosting.bat','firebase deploy --only hosting');
	clone.str2zip('deploy-firestore.bat','firebase deploy --only firestore');
	clone.str2zip('firebase.json',JSON.stringify(clone.firebase,null,"\t"));
	clone.str2zip('firestore.indexes.json',JSON.stringify(clone.indexes,null,"\t"));
	clone.str2zip('404.html','Error 404!<br>Not to see here','public/');
	
	//Add Kiai
	clone.kiai = (folder,file)=>fetch(`https://raw.githubusercontent.com/pwasystem/webpow/main/${folder}${file}`).then(res=>{return res.text()}).then(data=>clone.str2zip(file,data,folder));
	clone.str2zip('.env',`GEMINIKEY=${cloneGeminiKey.value}\nALLOWORIGIN=*`,'functions/');
	clone.str2zip('test.html',clone.db.apps.templates.html.replaceAll('<!--theme-color-->',cloneTheme.value),'functions/template/');
	clone.str2zip('template.html',clone.db.apps.template.html.replaceAll('<!--theme-color-->',cloneTheme.value),'functions/template/');
	clone.str2zip('install.bat','npm install','functions/');;
	clone.kiai('functions/','index.js');
	clone.kiai('functions/','package.json');
	clone.kiai('functions/','package-lock.json');
	clone.kiai('functions/template/','prompt.txt');
	clone.kiai('functions/template/','template.js');
	clone.kiai('functions/template/','test.js');
	
	//connection
	let connect=cloneConnection.value;
	connect=JSON.parse(connect.slice(connect.indexOf('{'),connect.indexOf('}')).trim().replace(/\n/g,'"').replace(/\s/g,'').replace(/:"/g,'":"')+'}');
	clone.name = connect.projectId;
	
	//service worker
	clone.sw = clone.dec2str(clone.zip['sw.js']).replace('WEBPOW',`${connect.projectId.toUpperCase()}_01-00-00`);
	delete clone.zip['sw.js'];
	clone.str2zip('sw.js',clone.sw,'public/');
	
	//manifest
	clone.manifest.short_name = clone.name;
	clone.manifest.name = clone.name;
	clone.manifest.description = cloneDescription.value;
	clone.manifest.background_color = clone.cor[cloneBackground.value];
	clone.manifest.theme_color = clone.cor[cloneTheme.value];
	clone.str2zip('manifest.json',JSON.stringify(clone.manifest,null,"\t"),'public/');
	
	//html
	clone.html = clone.html.replace('<!--title-->',clone.name).replace('<!--description-->',cloneDescription.value).replace('<!--keywords-->',cloneKeywords.value).replace('<!--author-->',cloneAuthor.value).replace('<!--reply-->',cloneEmail.value).replace('<!--themeHex-->',clone.cor[cloneTheme.value]).replace('<!--theme-->',cloneTheme.value).replace('<!--background-->',cloneBackground.value);
	clone.str2zip('index.html',clone.html,'public/');
	
	//firebaserc
	clone.firebaserc=clone.firebaserc.replace('<!--projectId-->',connect.projectId);
	clone.str2zip('.firebaserc',clone.firebaserc);
	
	//connect
	clone.str2zip('connect.js',`common='${clone.common}';\n${cloneConnection.value}`,'public/');

	//rules
	clone.str2zip('firestore.rules',clone.rules.replaceAll('<!--super-user-->',clone.super_user).replaceAll('<!--common-->',clone.common));

	//create user and database
	let destin=firebase.initializeApp(connect,"secondary"+key());
	let destinAuth=destin.auth();
	let destinFirestore=destin.firestore();
	destinAuth.createUserWithEmailAndPassword(cloneEmail.value,clonePassword.value).then(cu=>{
		let destinUser=destinAuth.currentUser;
		destinUser.updateProfile({displayName:clone.super_user,photoURL:'super-user'});		
		//database
		clone.dbString=JSON.stringify(clone.db,null,"\t").replaceAll('<!--super-user-->',clone.super_user).replaceAll('<!--common-->',clone.common).replaceAll('<!--project-name-->',clone.name).replaceAll('<!--theme-color-->',cloneTheme.value).replaceAll('<!--date-now-->',clone.date).replaceAll('<!--email-->',cloneEmail.value).replaceAll('<!--password-->',clonePassword.value).replaceAll('<!--user-id-->',destinUser.uid);
		clone.str2zip('firestore.database.json',clone.dbString);	
		clone.db = JSON.parse(clone.dbString);	
		for (col in clone.db) for (doc in clone.db[col]) destinFirestore.doc(col+'/'+doc).set(clone.db[col][doc]);
	}).then(()=>{
		show('#cloneBtn');					
		hide('#cloneLoad');
		hide('#cloneNew');
		show('#cloneDownload');		
		modal('Success','Clone has successfully created','green');
	});
});

clone.canvas2bin=(i,n,x,y)=>{
	let c=document.createElement('canvas');
	c.width=x;
	c.height=y;
	cx=c.getContext('2d');
	cx.clearRect(0,0,c.width,c.height);
	let w=(i.width>i.height?c.width:c.width*i.width/i.height)*(x==256&&y==256?0.66:1);
	let h=(i.width>i.height?c.width*i.height/i.width:c.height)*(y==256&&y==256?0.66:1);			
	cx.drawImage(i,(c.width-w)/2,(c.height-h)/2,w,h);
	var byteString = atob(c.toDataURL().split(',')[1]);
	let ia=new Array();
	for (var i = 0; i < byteString.length; i++)ia[i] = byteString.charCodeAt(i);
	let uint=[...new Uint8Array(ia)];
	uint.name=n;
	uint.modTime=new Date();
	uint.fileUrl=`public/${n}`;
	delete clone.zip[n];
	clone.zip[n]=uint;
}

clone.makeCanvasLogo=i=>{
	c=$('#cloneLogoView');
	m=$('#cloneLogoMasc');
	cx=c.getContext('2d');
	mx=m.getContext('2d');
	cx.clearRect(0,0,c.width,c.height);
	mx.clearRect(0,0,m.width,m.height);
	w=i.width>i.height?c.width:c.width*i.width/i.height;
	h=i.width>i.height?c.width*i.height/i.width:c.height;
	cx.drawImage(i,(c.width-w)/2,(c.height-h)/2,w,h);
	w=w*0.66;
	h=h*0.66;
	mx.drawImage(i,(c.width-w)/2,(c.height-h)/2,w,h);
	mx.beginPath();
	mx.arc(m.width/2,m.height/2,m.width*0.4,0,2*Math.PI);
	mx.stroke();
}

cloneLogo.addEventListener('change',e=>{	
		let fr=new FileReader();
		fr.onload=fr=>{				
			let img=new Image();
			img.src=fr.srcElement.result;
			img.onload=()=>{
				clone.makeCanvasLogo(img);
				clone.canvas2bin(img,'logo512.png',512,512);
				clone.canvas2bin(img,'logo256.png',256,256);
				clone.canvas2bin(img,'logo180.png',180,180);
				clone.canvas2bin(img,'home.webp',768,768);
			};
		};
		fr.readAsDataURL(e.target.files[0]);
	}
);

(clone.logoPop=()=>{
	let img=new Image();
	img.src='logo512.png';
	img.onload=()=>clone.makeCanvasLogo(img);
})();

clone.makeCanvasMain=i=>{
	c=$('#cloneLogoMainView');
	cx=c.getContext('2d');
	cx.clearRect(0,0,c.width,c.height);
	h=c.height-2;	
	w=i.width*h/i.height-2;
	c.width=w+2;
	cx.drawImage(i,1,(c.height-h)/2,w,h);
}

cloneLogoMain.addEventListener('change',e=>{	
		let fr=new FileReader();
		fr.onload=fr=>{				
			let img=new Image();
			img.src=fr.srcElement.result;
			img.onload=()=>{
				clone.makeCanvasMain(img);
				clone.canvas2bin(img,'logo.webp',img.width*3,img.height*3);
			};
		};
		fr.readAsDataURL(e.target.files[0]);
	}
);

clone.setColor=()=>{
	clone.Background = cloneBackground.value;	
	document.body.className = document.body.className.replaceAll(clone.BackgroundBackup,clone.Background);
	clone.BackgroundBackup = clone.Background;	
	clone.Theme = cloneTheme.value;
	for(a in x=document.querySelectorAll('[class*="'+clone.ThemeBackup+'"]')){
		if(x[a].toString().indexOf('object')>0&&x[a].toString().indexOf('Option')<0&&x[a].toString().indexOf('Body')<0){
			x[a].className = x[a].className.replaceAll(clone.ThemeBackup,clone.Theme);
		}
	}
	clone.ThemeBackup = clone.Theme;	
}

(clone.mainPop=()=>{
	let img=new Image();
	img.src='logo.webp';
	clone.ThemeBackup = 'deep-purple';
	clone.BackgroundBackup = 'white';
	img.onload=()=>clone.makeCanvasMain(img);
})();

cloneTheme.addEventListener('change',e=>clone.setColor());
cloneBackground.addEventListener('change',e=>clone.setColor());
cloneBtnDownload.addEventListener('click',()=>clone.makeZip());

clone.fecth2zip([
	'sw.js',
	'load.gif',
	'pow.js',
	'logo180.png',
	'logo256.png',
	'logo512.png',
	'home.webp',
	'logo.webp',
	'menu.webp',
	'pow.css',
	'favicon.ico',
	'debug/model.js',
	'debug/model.html'
],'public/');