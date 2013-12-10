function createPLaylistBlock(playlist_entry)
{
	var html  = '<li song_id="'+playlist_entry.id+'">';
		html += "<div class=score>";
		html += '<div class="upvote"></div>';
		html += '<div class="value">'+playlist_entry.score+'</div>';
		html += '<div class="downvote"></div>';
		html += "</div>";
		html += '<div class="song_content">';
		html += "<div class='album_art'><img src='/album_image?id="+playlist_entry.id+"'></img></div>";
		html += "<div class='song_info'>";
		html += "<div><span>Song title: </span>"+playlist_entry.title+"</div>";
		html += "<div class='hideOnPhone'><span>Album: </span>"+playlist_entry.album+"</div>";
		html += "<div class='hideOnPhone'><span>Artist: </span>"+playlist_entry.artist+"</div>";
		html += "<div class='hideOnPhone'><span>genre: </span>"+playlist_entry.genre+"</div>";
		html += "<div><span>Suggested by: </span><span class='username' userid = '"+playlist_entry.suggester+"'>"+getUser(playlist_entry.suggester).username+'</span>'+"</div>";
		html += '</div>';
		html += "</li>";
		return html;
}

function refreshPlaylist()
{
	$.get('/get_playlist', function(data){
		var newlist = '';
		for(var index in data)
		{
			newlist+=createPLaylistBlock(JSON.parse(data[index]));
		}
		$('ul#playlist').html(newlist);
	}, 'json');
}

function setSongPlaying(song)
{
	$('#song_title').html('Title: <em>'+song.title+'</em>');
	$('#song_suggester').html('Suggested by: <em class="username" userid ="'+song.suggester+'">'+getUser(song.suggester).username+'</em>');
}

function refreshCurrentPlayingSong()
{
	$.get('/get_current_song', function(data){
		if(data != null)
			setSongPlaying(data);
	}, 'json');
}

function animateSongInfoCycle()
{
	var title = $('#song_title');
	//var artist = $('#song_artist');
	var suggester = $('#song_suggester');

	var state = 0;
	setInterval(function(){
		if((state++)%2 == 0)
		{
			title.animate(
				{'left':'100%'}, 
		        {
		           duration : "fast",
		           easing: "linear",
		           complete: function(){
		           		title.css('left','-100%');
		           		title.addClass('hidden');
		           }
		        });
			suggester.removeClass('hidden');
			suggester.animate(
				{'left':'0%'}, 
		        {
		           duration : "slow",
		           easing: "linear",
		           complete: function(){
		           }
		        });
		}
		else
		{
			title.removeClass('hidden');
			title.animate(
				{'left':'0%'}, 
		        {
		           duration : "slow",
		           easing: "linear",
		           complete: function(){
		           }
		        });

			suggester.animate(
				{'left':'100%'}, 
		        {
		           duration : "fast",
		           easing: "linear",
		           complete: function(){
		           		suggester.css('left','-100%');
		           		suggester.addClass('hidden');
		           }
		        });
		}
	},5000);
}