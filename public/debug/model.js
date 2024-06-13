/* model.js */
model.Model={};
model.Models={};
model.db='model';

model.filterTime;
$('#modelFilterName').addEventListener('keyup',event=>{
	clearTimeout(model.filterTime);
	filterTime=setTimeout(model.list,400);
});
$('#modelFilterBtn').addEventListener('click',()=>flip('#modelFilter'));

$('#modelNewBtn').addEventListener('click',()=>{
	$('#modelEditData').reset();
	$('#modelEditLabel').innerHTML='New model';
	model.Model=Object.assign({	
		"id":key(),
		"name":"",
		"hash":"0"
	});
	show('#modelEdit');
});

model.list=()=>{
	$('#modelList').innerHTML=`<tr id='modelLoad'>
		<td colspan='3' class='w3-center'><img src='load.gif' alt='loading' width='50'></td>
	</tr>`;
	let filter=$('#modelFilterName').value!=''?`hash;>=;${hash($('#modelFilterName').value)}`:'';
	read(model.db,filter,'hash').then(data=>{
		$('#modelList').innerHTML='';
		if(data.length>=0){
			model.Models=Object.assign(data);
			for(const id in data){
				$('#modelList').insertAdjacentHTML('beforeend',`<tr>
					<td class='w3-point' id='modelBoss${id}'>${data[id].name}</td>
					<td class='w3-right'>
						<button class='w3-btn w3-tiny w3-round w3-blue w3-e' id='modelEdit${id}'>
							<span class='w3-w'>Edit</span>
							<span class='w3-y'>E</span>
						</button>
						<button class='w3-btn w3-tiny w3-round w3-red w3-e' id='modelDelete${id}'>
							<span class='w3-w'>Delete</span>
							<span class='w3-y'>D</span>
						</button>
					</td>
				</tr>`);
				$('#modelEdit'+id).addEventListener('click',()=>{
					model.Model=Object.assign({},model.Models[id]);
					$('#modelEditData').reset();
					$('#modelEditLabel').innerHTML=model.Model.name;
					$('#modelEditName').value=model.Model.name;
					show('#modelEdit');
				});
				$('#modelDelete'+id).addEventListener('click',()=>{
					if(confirm('Do you really want to delete the model?')){
						erase(`${model.db}/${id}`).then(()=>{
							model.list();
							modal('Success','Model deleted successfully','green');
						});
					}
				});
			}
		}else{
			$('#modelList').innerHTML="<tr id='modelLoad'><td colspan='3' class='w3-center'>Empty</td></tr>";
		}
	});
}
model.list({"id":"none","name":"None"});

model.save=data=>{
	model.Model.name=data.name;
	model.Model.hash=hash(data.name);
	write(model.db,model.Model,model.Model.id).then(()=>{
		show('#modelEditBtn');
		hide('#modelEditLoad');
		hide('#modelEdit');
		model.list();
		modal('Success','Data saved successfully','green');
	});
}

model.check=data=>{
	hide('#modelEditBtn');
	show('#modelEditLoad');
	if(model.hash=='0'||model.Model.name!=data.name){
		read(model.db ,`hash;==;${hash(data.name)}`,'',1).then(snap=>{
			if(snap.length>0){
				show('#modelEditBtn');
				hide('#modelEditLoad');
				modal('Caution','The chosen name already exists','yellow');
			}else{
				model.save(data);
			}
		});
	}else{
		model.save(data);
	}
}

form('modelEdit',model.check);