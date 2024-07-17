//{Title}

//{Title} Model Cards
function {title}ModalCard(number){
	$('#{title}ModalHeader').innerHTML=$('#{title}CardButton'+number).innerText;
	$('#{title}ModalSubtitle').innerHTML=$('#{title}CardsTitle'+number).innerHTML+': '+$('#{title}CardsSubtitle'+number).innerHTML;
	$('#{title}ModalText').innerHTML=$('#{title}CardsText'+number).innerHTML;
	$('#{title}ModalFooter').innerHTML=$('#{title}CardsFooter'+number).innerHTML;
	$('#{title}ModalImage').src=$('#{title}CardsImage'+number).src;
	$(`#{title}Modal`).style.display=`block`;
}

//{Title} Send
function {title}Send(e){
	data = getData(e);
	console.log('Sended contact {title}');
	console.log(data);
	return false;
}

//{Title} Tabs[number]
function {title}Tabs[number](number) {
	let tab = document.getElementsByClassName('{title}Tab[number]');
	for (let i = 0; i < tab.length; i++)tab[i].className = tab[i].className.replace('w3-show','w3-hide');
	$('#{title}Tab'+number).className = $('#{title}Tab'+number).className.replace('w3-hide','w3-show');
}

//{Title} Accordions
function {title}Accordions(number) {
	accordion = $('{title}Accordion'+number).className;
	$('#{title}Accordion'+number).className = accordion.indexOf('w3-hide') > -1 ? accordion.replace('w3-hide','w3-show') : accordion.replace('w3-show','w3-hide') ;
	
}

//{Title} Galery Slide [number]
var {title}SlideIndex[number] = 1;
{title}ShowDivs[number]({title}SlideIndex[number]);
function {title}PlusDivs[number](n) {
  {title}ShowDivs[number]({title}SlideIndex[number] += n);
}
function {title}ShowDivs[number](n) {
	let x = document.getElementsByClassName('{title}Slides0');
	if (n > x.length) {{title}SlideIndex[number] = 1}
	if (n < 1) {{title}SlideIndex[number] = x.length}
	for (let i = 0; i < x.length; i++) x[i].style.display = 'none';
	x[{title}SlideIndex[number]-1].style.display = 'block';
}