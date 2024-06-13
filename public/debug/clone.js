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

clone.firebase={"firestore":{"rules":"firestore.rules","indexes":"firestore.indexes.json"},"hosting":{"public":"public","headers":[{"source":"**/*.@(eot|otf|ttf|ttc|woff|font.css)","headers":[{"key":"Access-Control-Allow-Origin","value":"*"}]},{"source":"**/*.@(js|css)","headers":[{"key":"Cache-Control","value":"max-age=604800"}]},{"source":"**/*.@(jpg|jpeg|gif|png|webp)","headers":[{"key":"Cache-Control","value":"max-age=604800"}]},{"source":"404.html","headers":[{"key":"Cache-Control","value":"max-age=300"}]}],"ignore":["firebase.json","**/.*","**/node_modules/**"]}};

clone.indexes={"indexes":[{"collectionGroup":"apps","queryScope":"COLLECTION","fields":[{"fieldPath":"credential.menu","arrayConfig":"CONTAINS"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"apps","queryScope":"COLLECTION","fields":[{"fieldPath":"credential.read","arrayConfig":"CONTAINS"},{"fieldPath":"dad","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"groups","queryScope":"COLLECTION","fields":[{"fieldPath":"boss","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"groups","queryScope":"COLLECTION","fields":[{"fieldPath":"id","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"deleted","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]},{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"group","order":"ASCENDING"},{"fieldPath":"hash","order":"ASCENDING"}]}],"fieldOverrides":[]};

clone.rules=`rules_version='2';\r\n\tservice cloud.firestore {\r\n\tmatch /databases/{database}/documents {\r\n\t\tmatch /apps/{docId} {\r\n\t\t\tallow list: if '<!--common-->' in resource.data.credential.read || '<!--common-->' in resource.data.credential.menu || request.auth.token.name == '<!--super-user-->' || request.auth.token.name in resource.data.credential.menu;\r\n\t\t\tallow get,read: if '<!--common-->' in resource.data.credential.read || request.auth.token.name in resource.data.credential.read || request.auth.token.name == '<!--super-user-->';\r\n\t\t\tallow write: if request.auth.token.name in resource.data.credential.write || request.auth.token.name == '<!--super-user-->' || '<!--common-->' in resource.data.credential.write;\r\n\t\t}\r\n\t\tmatch /users/{userId} {\r\n\t\t\tallow create,get,update,delete: if request.auth.uid == userId;\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t\t\tmatch /groups/{grupoId} {\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t\t\tmatch /model/{grupoId} {\r\n\t\t\tallow read,write: if request.auth.token.name == '<!--super-user-->';\r\n\t\t}\r\n\t}\r\n}`;

clone.firebaserc=`{\r\n\t"projects":{\r\n\t\t"default":"<!--projectId-->"\r\n\t}\r\n}`;

clone.apps={};
clone.groups={};
clone.users={};
clone.connect='';


//clone color
clone.cor=new Array();
clone.cor['w3-red']='f44336';
clone.cor['w3-pink']='e91e63';
clone.cor['w3-purple']='9c27b0';
clone.cor['w3-deep-purple']='673ab7';
clone.cor['w3-indigo']='3f51b5';
clone.cor['w3-blue']='2196F3';
clone.cor['w3-light-blue']='87ceeb';
clone.cor['w3-cyan']='00bcd4';
clone.cor['w3-aqua']='00ffff';
clone.cor['w3-teal']='009688';
clone.cor['w3-green']='4caf50';
clone.cor['w3-light-green']='8bc34a';
clone.cor['w3-lime']='cddc39';
clone.cor['w3-sand']='fdf5e6';
clone.cor['w3-khaki']='f0e68c';
clone.cor['w3-yellow']='ffeb3b';
clone.cor['w3-amber']='ffc107';
clone.cor['w3-orange']='ff9800';
clone.cor['w3-deep-orange']='ff5722';
clone.cor['w3-blue-gray']='607d8b'; 
clone.cor['w3-brown']='795548';
clone.cor['w3-light-gray']='f1f1f1';
clone.cor['w3-gray']='9e9e9e';
clone.cor['w3-dark-gray']='616161';
clone.cor['w3-pale-red']='ffdddd';
clone.cor['w3-pale-yellow']='ffffcc';
clone.cor['w3-pale-green']='ddffdd';
clone.cor['w3-pale-blue']='ddffff'; 

cloneBtnExportJson.addEventListener(`click`,()=>{
	Firestore.collection('apps').get().then(apps=>{
		apps.forEach(obj=>clone.apps[obj.id]=obj.data());
		Firestore.collection('users').get().then(users=>{
			users.forEach(obj=>clone.users[obj.id]=obj.data());
			Firestore.collection('groups').get().then(groups=>{
				groups.forEach(obj=>{
					clone.groups[obj.id]=obj.data();
					groupReg=new RegExp(`<!--${clone.groups[obj.id].hash}-->`,'g');
					clone.rules=clone.rules.replace(groupReg,obj.id);
				});
				clone.firebaserc=clone.firebaserc.replace('<!--projectId-->',firebaseConfig.projectId);
				clone.connect=`common='${common}';\nfirebaseConfig=${JSON.stringify(firebaseConfig,null,"\t")}`;
				clone.download();
			});
		});
	});
});

clone.download=()=>{
	clone.str2zip('server.bat','firebase serve --only hosting');
	clone.str2zip('deploy.bat','firebase deploy');
	clone.str2zip('firestore.rules',clone.rules);
	clone.str2zip('firebase.json',JSON.stringify(clone.firebase,null,"\t"));
	clone.str2zip('firestore.indexes.json',JSON.stringify(clone.indexes,null,"\t"));
	clone.str2zip('firestore.database.json',JSON.stringify({apps:clone.apps,groups:clone.groups,users:clone.users},null,"\t"));
	clone.str2zip('.firebaserc',clone.firebaserc);
	clone.str2zip('connect.js',clone.connect,'public/');
	clone.str2zip('404.html','Error 404!<br>Not to see here','public/');
	$('#cloneBtnDownload').addEventListener('click',()=>clone.makeZip());
	hide('#cloneNew');
	show('#cloneDownload');
}

cloneStart.addEventListener('click',()=>{
	if(!$('#cloneData').checkValidity())return false;
	hide('#cloneBtn');
	show('#cloneLoad');
	let connect=$('#cloneConnection').value;
	connect=JSON.parse(connect.slice(connect.indexOf('{'),connect.indexOf('}')).trim().replace(/\n/g,'"').replace(/\s/g,'').replace(/:"/g,'":"')+'}');
	clone.name=connect.projectId;
	caches.keys().then(x=>{
		const newSw=clone.dec2str(clone.zip['sw.js']).replace(x[0],`${connect.projectId.toUpperCase}_01-00-00`);
		delete clone.zip['sw.js'];
		clone.str2zip('sw.js',newSw,'public/');
	})
	let manifest=JSON.parse(clone.dec2str(clone.zip['manifest.json']).replace(clone.corLit,clone.corLitN).replace(clone.corHex,clone.corHexN).replace(clone.corTex,clone.corTexN).replace(clone.corBor,clone.corBorN));
	//inserir campos de configuração do html
	let html=clone.dec2str(clone.zip['index.html']).replace(manifest.short_name,connect.projectId).replace(clone.corLit,clone.corLitN).replace(clone.corHex,clone.corHexN).replace(clone.corTex,clone.corTexN).replace(clone.corBor,clone.corBorN);
	delete clone.zip['index.html'];
	clone.str2zip('index.html',html,'public/');	
	manifest.short_name=connect.projectId;
	manifest.name=connect.projectId;
	manifest.description=`${connect.projectId}, Created by WebPoW`;
	delete clone.zip['manifest.json'];
	clone.str2zip('manifest.json',JSON.stringify(manifest,null,"\t"),'public/');
	clone.firebaserc=clone.firebaserc.replace('<!--projectId-->',connect.projectId);
	const destin=firebase.initializeApp(connect,"secondary"+key());
	const destinAuth=destin.auth();
	const destinFirestore=destin.firestore();
	destinAuth.createUserWithEmailAndPassword($('#cloneEmail').value,$('#clonePassword').value).then(cu=>{
		var desUser=destinAuth.currentUser;
		let groupOld={};
		let groupNew={};
		let groupHash={};
		read('groups').then(groups=>{
			for(const group in groups){			
				hashId=groups[group].hash;
				groupOld[hashId]=new RegExp(groups[group].id,'g');
				groupNew[hashId]=key();
				groups[group].id=groupNew[hashId];			
				groupReg=new RegExp(`<!--${hashId}-->`,'g');
				clone.rules=clone.rules.replace(groupReg,groupNew[hashId]);
				clone.groups[hashId]=groups[group];
				destinFirestore.doc('groups/'+groupNew[hashId]).set(groups[group]);
			}
			Firestore.collection('apps').get().then(apps=>{
				var appsOld={};
				apps.forEach(obj=>appsOld[obj.id]=obj.data());
				let appsJson=JSON.stringify(appsOld);
				for(const group in groupOld)appsJson=appsJson.replace(groupOld[group],groupNew[group]).replace(clone.corLit,clone.corLitN).replace(clone.corHex,clone.corHexN).replace(clone.corTex,clone.corTexN).replace(clone.corBor,clone.corBorN);
				clone.apps=JSON.parse(appsJson);
				for(const name in clone.apps)destinFirestore.doc('apps/'+name).set(clone.apps[name]);
				clone.users=Object.assign({
					"id":desUser.uid,
					"created":new Date(),
					"edited":new Date(),
					"deleted":"0",
					"hash":"super-user",
					"group":groupNew['super-user'],
					"name":"Super User",
					"email":$('#cloneEmail').value,
					"password":$('#clonePassword').value
				});
				destinFirestore.doc('users/'+desUser.uid).set(clone.users).then(()=>desUser.updateProfile({displayName:groupNew['super-user'],photoURL:'super-user'}).then(()=>{
					show('#cloneBtn');					
					hide('#cloneLoad');
					clone.connect=`common='${groupNew["common"]}';\n${$('#cloneConnection').value.trim()}`;
					clone.download();
					modal('Success','Clone has successfully created','green');
				}));
			});
		});
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
	clone.corLitN=cloneBarColor.value;
	clone.corTexN=clone.corLitN.replace('w3-','w3-text-');
	clone.corBorN=clone.corLitN.replace('w3-','w3-border-');
	clone.corHexN=clone.cor[clone.corLitN];
}

(clone.mainPop=()=>{
	let img=new Image();
	img.src='logo.webp';
	img.onload=()=>clone.makeCanvasMain(img);
	cloneBarColor.value=$('#cloneLogoMainView').className;
	clone.corLit=new RegExp(cloneBarColor.value,"ig");
	clone.corTex=new RegExp(cloneBarColor.value.replace('w3-','w3-text-'),"ig");
	clone.corBor=new RegExp(cloneBarColor.value.replace('w3-','w3-border-'),"ig");
	clone.corHex=new RegExp(clone.cor[cloneBarColor.value],"ig");
	clone.setColor();
})();

cloneBarColor.addEventListener('change',e=>{
	clone.setColor();
	$('#cloneLogoMainView').classList.remove($('#cloneLogoMainView').className);
	$('#cloneLogoMainView').classList.add(cloneBarColor.value);
})

clone.fecth2zip([
	'sw.js',
	'manifest.json',
	'load.gif',
	'pow.js',
	'logo180.png',
	'logo256.png',
	'logo512.png',
	'home.webp',
	'index.html',
	'logo.webp',
	'menu.webp',
	'pow.css',
	'favicon.ico'
],'public/');
