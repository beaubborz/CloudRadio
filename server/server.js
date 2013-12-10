var http = require('http');
var url = require('url'); 
var fs = require('fs');
var express = require('express');
var process = require('child_process');
var redis   = require('redis');
var pl = require('./playlist');
var users = require('./user');
var helpers = require('./helpers');

var redis_server = process.spawn("node_modules/redis/bin/64bit/redis-server.exe");
var publisherClient = redis.createClient();

var EVENT_TYPES = require(__dirname+'/../shared/event_types').EVENT_TYPES;

var STATE = {
	STOPPED: 'stopped',
	PLAYING: 'playing',
	PAUSED: 'paused',
	WAITING_FOR_SONGS: 'waiting for songs'
};
var player_state = STATE.STOPPED;

var app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart({uploadDir:'./uploaded_data', limit:'1024mb'}));
var AUTHORIZED_EXTENSIONS = ['mp3', 'mp4', 'm4a', 'flac', 'ogg', 'wav', 'wma', 'avi', 'mpg'];


app.use("/css", express.static(__dirname + '/../client/css'));
app.use("/script", express.static(__dirname + '/../client/script'));
app.use("/images", express.static(__dirname + '/../client/images'));
app.use("/shared", express.static(__dirname + '/../shared'));

var radio = process.spawn("RadioPlayer/Debug/RadioPlayer.exe");

radio.stdout.on('data', function(chunk){
	var message = ""+chunk;
	if(message.indexOf('$')>=0)
	{
		message = message.replace('$', '');
		console.log('NODEJS detected that the song ended.');
		playNextSong();
	}

	if(message.indexOf('%')>=0)
	{
		var str = message.match('%[0-9]+%')[0];
		str = str.slice(1, str.length-1);
		publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.SONG_PROGRESS_CHANGED, progress: str}) );
	}
});

radio.stderr.on('data', function(chunk){
	console.log(""+chunk);
});

// Create the server. 
app.get('/', function(request,response){
	response.end(fs.readFileSync('../client/index.html'));
});

app.post('/envoyer_fichier', function(request, response)
{
	var myself = users.getUserIDFromRequest(request);

	for(var i in request.files.fichier)
	{
		var fichier = request.files.fichier[i];

		//dont keep unallowed filetypes.
		if(AUTHORIZED_EXTENSIONS.indexOf(fichier.originalFilename.split('.').pop().toLowerCase())==(-1))
		{
			fs.unlinkSync(fichier.path);
			continue;
		}

		var entry = pl.createEntryFromFile(fichier.path);
		entry.suggester = myself;

		if(entry.title == null)
			entry.title = fichier.originalFilename;
		pl.push(entry);
	}

	response.end('File recieved.\n');
  	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.PLAYLIST_CHANGED, descr:'playlist_changed'}) );
});

app.get('/play', function(request, response){
	response.end('playing.');

	switch(player_state)
	{
		case STATE.STOPPED:
			playNextSong();
		break;
	};

	radio.stdin.write('PLAY\n');	
	player_state = STATE.PLAYING;
});

app.get('/pause', function(request, response){
	radio.stdin.write("PAUSE\n");	
	response.end('paused.');
	player_state = STATE.PAUSED;
});

app.get('/stop', function(request, response){
	radio.stdin.write("STOP\n");	
	response.end('stopped.');
	player_state = STATE.STOPPED;
});

app.get('/upvote', function(request, response){
	var id = url.parse(request.url, true).query['id'];
	response.end('upvoted song #'+id);

	var success = pl.upvote(id, users.getUserIDFromRequest(request));
	if(success)
	{
		pl.sortByScore();
  		publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.PLAYLIST_CHANGED, descr:'playlist_changed'}) );
	}
});

app.get('/downvote', function(request, response){
	var id = url.parse(request.url, true).query['id'];
	response.end('downvoted song #'+id);

	var success = pl.downvote(id, users.getUserIDFromRequest(request));
	if(success)
	{
		pl.sortByScore();
  		publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.PLAYLIST_CHANGED, descr:'playlist_changed'}) );
  	}
});

app.get('/album_image', function(request, response){
	var id = url.parse(request.url, true).query['id'];

	var song = pl.getElementById(id);

	response.setHeader('Content-Type', song.image['Content-Type']);
	response.end(song.image.data);
});

app.get('/events', function(req, res) {

	var messageCount = 0;

	// let request last as long as possible
	req.socket.setTimeout(Infinity);

	var subscriber = redis.createClient();

	subscriber.subscribe("updates");

	// In case we encounter an error...print it out to the console
	subscriber.on("error", function(err) {
	console.log("Redis Error: " + err);
	});

	// When we receive a message from the redis connection
	subscriber.on("message", function(channel, message) {
	messageCount++; // Increment our message count

	res.write('id: ' + messageCount + '\n');
	res.write("data: " + message + '\n\n'); // Note the extra newline
	});

	//send headers for event-stream connection
	res.writeHead(200, {
	'Content-Type': 'text/event-stream',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive'
	});
	res.write('\n');

	//one more client arrived!!
	if(!users.userExists(users.getUserIDFromRequest(req)))
		users.addUser(users.getUserIDFromRequest(req));

  	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.USERLIST_CHANGED, descr:'number of clients changed.'}) );


	// The 'close' event is fired when a user closes their browser window.
	// In that situation we want to make sure our redis channel subscription
	// is properly shut down to prevent memory leaks...and incorrect subscriber
	// counts to the channel.
	req.on("close", function() {
	//users.removeUser(users.getUserIDFromRequest(req));
	subscriber.unsubscribe();
	subscriber.quit();
  	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.USERLIST_CHANGED, descr:'number of clients changed.'}) );
	});

});

app.get('/get_playlist', function(req, res){
	var arr = new Array();
	var playlist = pl.getPlaylist();
	for(var index in playlist)
	{
		arr.push(playlist[index].toJSON());
	}
	res.end(JSON.stringify(arr));
});


app.get('/client_count', function(req,res){
	res.end(''+users.getUserCount());
});

app.get('/get_user', function(req, res){
	var userid = url.parse(req.url, true).query['id'];
	if(helpers.isEmpty(userid))
	{
		userid = users.getUserIDFromRequest(req);
	}
	
	var u = users.getUserByID(userid);
	u.id = userid;
	res.end(JSON.stringify(u));
});

app.post('/set_username', function(req, res){
	res.end('name changed.');
	var username = req.body.username;
	if(username.match("^([a-zA-Z0-9]| )*$"))
	{
		var userid = users.getUserIDFromRequest(req);
		users.changeUsername(userid, username);
  		publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.USERNAME_CHANGED, descr:'a user changed his name', 'ID':userid, 'username':username}) );
	}
});

app.get('/get_current_song', function(req, res){
	var song = pl.getPlayingSong();
	if(!helpers.isEmpty(song))
		res.end(pl.getPlayingSong().toJSON());
	else
		res.end();
});

app.get('/shuffle_playlist', function(req, res){
	pl.shuffle();
	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.PLAYLIST_CHANGED, descr:'playlist_changed'}) );
	res.end('playlist shuffled.');
});

app.post('/chat', function(req, res){
	var sentByUserID = users.getUserIDFromRequest(req);
	var message = req.body.message;

	publisherClient.publish('updates', JSON.stringify({'type':EVENT_TYPES.NEW_MESSAGE, 'userid': sentByUserID, 'message': message}));
	res.end('message sent.');
});

app.listen(8080);


function playNextSong()
{
	var song = pl.getNextSong();
	console.log('gotta play: '+song.title);
	var path = song.filepath;
	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.PLAYLIST_CHANGED, descr:'playlist_changed'}) );
	publisherClient.publish( 'updates', JSON.stringify({type:EVENT_TYPES.SONG_PLAYING, descr:'new song playing.', 'song':song.toJSON()}));
	radio.stdin.write('SET_SONG\n'+path+'\nPLAY\n');
}