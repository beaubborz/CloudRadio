var fs = require('fs');
var ID3 = require('id3');
var helpers = require('./helpers');

var playlist = new Array();

var playlist_uniqueID = 0;

var playing_song = null;

function isEmpty(elem)
{
	return (elem == null || elem == undefined || elem == '');
}

function getUniqueID()
{
	return playlist_uniqueID++;
};

exports.shuffle = function()
{
	for(var i in playlist)
	{
		playlist[i].age = Math.ceil(Math.random()*1000);
	}
	exports.sortByScore();
};

//constructor to make a playlist entry object.
exports.Entry = function(){
	this.id = null;
	this.score = null;
	this.age = null;
	this.title = null;
	this.artist = null;
	this.album = null;
	this.genre = null;
	this.filepath = null;
	this.suggester = null;
	this.voters = {};

	this.image = {
	'Content-Type':null,
	'data':null
	};

	this.toJSON = function(full){
		if(isEmpty(full))
			full = false;

		var e = {
			id: this.id,
			score: this.score,
			age: this.age,
			title: this.title,
			artist: this.artist,
			album: this.album,
			genre: this.genre,
			suggester: this.suggester,
		};

		if(full)
		{
			e['filepath'] = this.filepath;
			e['image'] = this.image;
		}

		return JSON.stringify(e);
	};
};
exports.createEntryFromFile = function(filepath)
{
	var entry = new exports.Entry();
	var song = fs.readFileSync(filepath);
	entry.filepath = filepath;
	var song_id3 = new ID3(song);
	song_id3.getTags()
	song_id3.parse();

	//set id
	entry.id = getUniqueID();

	//set score
	entry.score = 0;
	entry.age = 0;

	//get song title:
	entry.title = song_id3.get('title');
	if(isEmpty(entry.title))
	{
		entry.title = null;
	}

	//get song artist:
	entry.artist = song_id3.get('artist');
	if(isEmpty(entry.artist))
	{
		entry.artist = null;
	}

	//get song album:
	entry.album = song_id3.get('album');
	if(isEmpty(entry.album))
	{
		entry.album = null;
	}

	//get song genre:
	entry.genre = song_id3.get('genre');
	if(isEmpty(entry.genre))
	{
		entry.genre = null;
	}

	//get song album cover:
	var picture = song_id3.get('picture');
	if(isEmpty(picture))
	{
		entry.image['Content-Type'] = 'image/png';
		entry.image['data'] = fs.readFileSync(__dirname + '/../client/images/no_cover.png');
	}
	else
	{
		entry.image['Content-Type'] = picture.format;
		entry.image['data'] = picture.data;
	}

	return entry;
};

exports.sortByScore = function()
{
	playlist.sort(function(a, b){
		if(a.score == b.score)
		{
			return b.age - a.age;
		}
		else
		{
			return b.score - a.score;
		}
	});
};


exports.findElementById = function(id)
{
	for(var i in playlist)
	{
		if(playlist[i].id == id)
		{
			return i;
		}
	}
	return null;
};

exports.getElementById = function(id)
{
	return playlist[exports.findElementById(id)];
};

exports.agePlaylist = function()
{
	for(var index in playlist)
	{
		playlist[index].age++;
	}
}

exports.push = function(entry)
{
	playlist.push(entry);
}

exports.getNextSong = function()
{
	if(playlist.length == 0)
		return playing_song;

	if(!helpers.isEmpty(playing_song))
	{
		exports.push(playing_song);
	}

	exports.sortByScore();
	playing_song = playlist[0];
	playlist = playlist.slice(1);

	exports.agePlaylist();
	playing_song.score = 0;
	playing_song.age = 0;
	playing_song.voters = {};

	return playing_song;
}

exports.getPlaylist = function()
{
	return playlist;
};

exports.upvote = function(id, userID)
{
	var song = playlist[exports.findElementById(id)];

	if(song.voters[userID] == undefined)
	{
		song.voters[userID] = 1;
		song.score++;
		return true;
	}
	else if(song.voters[userID] == 1)
	{
		delete song.voters[userID];
		song.score--;
		return true;
	}
	else
	{
		song.voters[userID] = 1;
		song.score+=2;
		return true;
	}

	playlist[exports.findElementById(id)] = song;
	return false;
};

exports.downvote = function(id, userID)
{
	var song = playlist[exports.findElementById(id)];

	if(song.voters[userID] == undefined)
	{
		song.voters[userID] = 0;
		song.score--;
		return true;
	}
	else if(song.voters[userID] == 0)
	{
		delete song.voters[userID];
		song.score++;
		return true;
	}
	else
	{
		song.voters[userID] = 0;
		song.score-=2;
		return true;
	}

	playlist[exports.findElementById(id)] = song;
	return false;
};

exports.getPlayingSong = function()
{
	return playing_song;
}