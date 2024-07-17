//Test

//Test Modal Cards
function testModalCard(number){
	$('#testModalHeader').innerHTML=$('#testCardButton'+number).innerText;
	$('#testModalSubtitle').innerHTML=$('#testCardsTitle'+number).innerHTML+': '+$('#testCardsSubtitle'+number).innerHTML;
	$('#testModalText').innerHTML=$('#testCardsText'+number).innerHTML;
	$('#testModalFooter').innerHTML=$('#testCardsFooter'+number).innerHTML;
	$('#testModalImage').src=$('#testCardsImage'+number).src;
	$(`#testModal`).style.display=`block`;
}

//Test Tabs 0
function testTabs0(number) {
	let x = document.getElementsByClassName('testTab0');
	for (let i = 0; i < x.length; i++)x[i].className = x[i].className.replace('w3-show','w3-hide');
	$('#testTab'+number).className = $('#testTab'+number).className.replace('w3-hide','w3-show');
}

//Test Accordions
function testAccordions(number) {
	accordion = $('#testAccordion'+number).className;
	$('#testAccordion'+number).className = accordion.indexOf('w3-hide') > -1 ? accordion.replace('w3-hide','w3-show') : accordion.replace('w3-show','w3-hide') ;
	
}

//Test Galery Slide 0
var testSlideIndex0 = 1;
testShowDivs0(testSlideIndex0);
function testPlusDivs0(n) {
  testShowDivs0(testSlideIndex0 += n);
}
function testShowDivs0(n) {
	let x = document.getElementsByClassName('testSlides0');
	if (n > x.length) {testSlideIndex0 = 1}
	if (n < 1) {testSlideIndex0 = x.length}
	for (let i = 0; i < x.length; i++) x[i].style.display = 'none';
	x[testSlideIndex0-1].style.display = 'block';
}

//Test Send
function testSend(e){
	data = getData(e);
	console.log('Sended contact test');
	console.log(data);
	return false;
}