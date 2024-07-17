`use_strict`;
//if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
firebase.initializeApp(firebaseConfig);
var Auth=firebase.auth();
var Firestore=firebase.firestore();
//Firestore.enablePersistence();
firebase.analytics();

var user=null;
Auth.onAuthStateChanged(currentUser=>user=currentUser?currentUser:null);

//Create pointer to object
$=obj=>document.querySelector(obj);
//Callback a function
_=(callback,args)=>callback(args);
//Generates a random key
key=(size=16)=>Array.from(new Uint8Array(crypto.getRandomValues(new Uint8Array(size)))).map(data=>data.toString(16).padStart(2,`0`)).join(``);
//Convert word to hash
hash=word=>word.normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/[^\w\s]/gi,``).replace(/\s/g,`-`).replace(/--/g,`-`).toLowerCase();

//Show, hide and flip element
show=id=>$(id).className.indexOf(`w3-hide`)>=0?$(id).className=$(id).className.replace(`w3-hide`,`w3-show`):$(id).className+=` w3-show`;
hide=id=>$(id).className.indexOf(`w3-show`)>=0?$(id).className=$(id).className.replace(`w3-show`,`w3-hide`):$(id).className+=` w3-hide`;
flip=id=>$(id).className=$(id).className.indexOf(`w3-show`)==-1?$(id).className.replace(`w3-hide`,`w3-show`):$(id).className.replace(`w3-show`,`w3-hide`);

//load modules and hash
modules().then(()=>{
	window.onpopstate=event=>main(location.hash.substr(1));
	window.onload=event=>main(location.hash.substr(1));
	if(location.hash.indexOf(`#`)<0)location.hash=`#home`;
});

//Fetch URL
function ajax(url,callback){
	fetch(url).then(data=>{
		return data.text();
	}).then(text=>{
		_(callback,text);
	});
}

//Load JS function
function js(text,id=`debug`){
	let obj=$(`#${id}JS`);
	if(obj)obj.remove();
	obj=document.createElement(`script`);
	$(`head`).insertBefore(obj,$(`head`).lastChild);
	obj.id=`${id}JS`;
	obj.src=`data:text/javascript;base64,${btoa(unescape(encodeURIComponent(text)))}`;
}

//Load app
function main(hash){
	$(`main`).innerHTML=`<figure class='w3-center'><img src='load.gif' alt='loading' width='50' height='50'></figure>`;
	read(`apps/${hash}`).then(data=>{
		if(data!=`permission-denied`){
			$(`main`).innerHTML=data.html;
			js(data.javascript,data.hash);
		}else{
			$(`main`).innerHTML=`<h3 class='w3-container w3-center w3-yellow'>403 Forbidden</h3>`;
		}
	}).catch(error=>{
		$(`main`).innerHTML=`<h3 class='w3-container w3-center w3-yellow'>404 Not found</h3>`;
	});
}

//Insert data
async function modules(){
	read(`apps`,`credential.read;array-contains;${user?user.displayName:common}|dad;==;modules`).then(data=>{
		for(const id in data){
			$(data[id].module).insertAdjacentHTML(`beforeend`,data[id].html);
			js(data[id].javascript,id);
		}
	});
}

//Debug app
function debug(app,local=`main`){
	ajax(`debug/${app}.html`,text=>local==`main`?$(local).innerHTML=text:$(local).insertAdjacentHTML(`beforeend`,text));
	ajax(`debug/${app}.js`,js);
}

//Deploy app
function deploy(name,dad=`root`,module=`none`){
	file=hash(name);
	let app=Object.assign({	
		"credential":{"write":[user.displayName],"menu":[user.displayName],"read":[user.displayName]},
		"dad":dad,
		"hash":hash(name),
		"module":module,
		"html":"",
		"javascript":"",
		"name":name
	});
	fetch(`debug/${file}.html`).then(html=>{
		return html.text();
	}).then(html=>{
		app.html=html;
		fetch(`debug/${file}.js`).then(javascript=>{
			return javascript.text();
		}).then(javascript=>{
			app.javascript=javascript;
			write(`apps`,app,file).then(()=>console.log(`Deploy: ${file} ok`));
		});
	});
}

//Read Firestore database
function read(table,where,order,limit){
	try{
		return Firestore.doc(table).get().then(snap=>{
			return snap.data();
		}).catch(error=>{
			console.log(error);
		});
	}catch{
		let query=Firestore.collection(table);
		if(where){
			let condition=where.split(`|`);
			for(let count=0;count<condition.length;count++){
				let term=condition[count].split(`;`);
				term[2]=term[2].indexOf(`*`)<0?term[2]:term[2].substr(1).split(`,`);
				query=query.where(term[0],term[1],term[2]);
			}
		}
		if(order){
			let term=order.split(`,`);
			query=query.orderBy(term[0],term[1]);
		}
		if(limit)query=query.limit(limit);
		return query.get().then(snap=>{
			let ret=[];
			ret.length=snap.docs.length;
			snap.forEach(data=>ret[data.id]=data.data());
			return ret;
		}).catch(error=>{
			console.log(error);
		});
	}
}

//Write data in Firestore database
function write(table,data,update){
	let query=Firestore.collection(table);
	query=update?query.doc(update).set(data):query.add(data);
	return query.then(register=>{
		return register?register.id:update;
	}).catch(error=>{
		console.log(error);
	});
}

//Erase data in firestore database
function erase(ref){
	return Firestore.doc(ref).delete().then(()=>{
		return true;
	}).catch(error=>{
		console.log(error);
	});
}

//Add form actions
function form(id,callback){
	$(`#${id}Close`).addEventListener(`click`,()=>hide(`#${id}`));
	$(`#${id}Cancel`).addEventListener(`click`,()=>hide(`#${id}`));
	$(`#${id}Data`).addEventListener(`submit`,event=>{
		post($(`#${id}Data`),callback);
		event.preventDefault();
	});
}

//Post JSON to callback
function post(form,callback){
	let id=form.id.replace(`Data`,``);
	if(!form.checkValidity())return false;
	let data=Object.create(null);
	for(let key=0;key<form.length;key++){
		if([`fieldset`,`button`,`reset`,`submit`,`legend`].indexOf(form[key].type)==-1&&form[key].name&&form[key].name!=`undefined`){
			data[form[key].name.replace(id,``).toLowerCase()]=form[key].value;
			data[form[key].name.replace(id,``).toLowerCase()]=form[key].type==`file`?form[key].files[0]:(form[key].type==`checkbox`?form[key].checked:form[key].value);
		}
	}
	_(callback,data);
	return false;
}

//Form to JSON
function getData(e){
	let data = '{';
	for(let i = 0 ; i < e.length ; i++)if(e[i].id) data+='"'+e[i].id+'":"'+e[i].value+'",';
	return JSON.parse(data.slice(0,-1)+'}');
}