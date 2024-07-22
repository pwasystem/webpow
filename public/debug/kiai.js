//kiai

//Request Kiai content
function kiai(f){
	//Set variables
	let form = new FormData(f);
	let json = Object.fromEntries(form.entries());
	json.kiaiDescription = json.kiaiDescription.replaceAll('\n','\\n');
	let value = JSON.stringify(json);
	//Set display on request
	kiaiForm.style = 'display:none';
	kiaiView.style = 'display:none';
	kiaiLoad.style = 'display:block';	
	//Post data
	fetch(f.action,{
		method : 'POST',
		header : {'Content-Type': 'application/json; charset=UTF-8'},
		body: value,
	}).then(response=>{
		//receive fetch
		return response.text();
	}).then(myText=>{
		//Response to ok fetch
		let data = JSON.parse(myText);
		kiaiForm.style = 'display:block';
		kiaiView.style = 'display:block';
		kiaiLoad.style = 'display:none';
		deploy(data.title,'kiai');
		kiaiView.innerHTML = `<p>The ${data.title} page was created successfully, <a href='#${data.hash}' target='${data.hash}'>click here</a> to see the results.</p>`;
	}).catch(error=>{
		//Response to error fetch
		kiaiForm.style = 'display:block';
		kiaiView.style = 'display:block';
		kiaiLoad.style = 'display:none';
		kiaiView.innerHTML = `<div class='w3-red w3-panel w3-center'><h4>Error generating the "${kiaiTitle.value}" page.</h4><p class='w3-opacity'>${error.message}</p></div>`;
	});			
	return false;
}