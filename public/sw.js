var cacheName = 'WEBPOW_01-00-00';
var urlsToCache = [
	'/'
]
/*
var urlsToCache = [
	'/',
	'load.gif',
	'connect.js',
	'pow.js',
	'manifest.json',
	'logo180.png',
	'logo256.png',
	'logo512.png',
	'404.html',
	'index.html',
	'home.webp',
	'logo.webp',
	'menu.webp',
	'pow.css',
	'favicon.ico'
]
*/

self.addEventListener('install',event=>{
	event.waitUntil(
		caches.open(cacheName).then(cache=>{
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener('activate',event=>{
	event.waitUntil(caches.keys().then(cacheNames=>{
		return Promise.all(cacheNames.map(cache=>{
			if([cacheName].indexOf(cache)===-1)return caches.delete(cache);
		}));
	}));
});

self.addEventListener('fetch',event=>{
	event.respondWith(caches.match(event.request).then(response=>{
		if(response)return response;
		return fetch(event.request.clone()).then(response=>{
			if(!response||response.status!==200||response.type!=='basic')return response;
			var responseToCache=response.clone();
			caches.open(cacheName).then(cache=>{
				cache.put(event.request,responseToCache);
			});
			return response;
		});
	}));
});