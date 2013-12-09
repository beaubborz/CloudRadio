$('form#suggest button#submit').click(function(e){
	e.preventDefault();
	$(this).siblings('input[type=file]').click();
});

$('form#suggest input[type=file]').change(function(){

	$('form#suggest button#submit').hide();
	$('form#suggest #upload_progress').show();

	var fd = new FormData();
	for(var i in this.files) 
		fd.append( 'fichier['+i+']', this.files[i]);

	$.ajax({
		url: '/envoyer_fichier',
		data: fd,
		processData: false,
		contentType: false,
		type: 'POST',
		xhr: function()
		{
			var xhr = new window.XMLHttpRequest();
			//Upload progress
			xhr.upload.addEventListener("progress", function(evt){
			if (evt.lengthComputable) {
				var percentComplete = evt.loaded / evt.total;
				//Do something with upload progress
				$('form#suggest #upload_progress').val(percentComplete*100);
			}
			}, false);

			return xhr;
		},


	  success: function(data){
		$('form#suggest #upload_progress').hide();
		$('form#suggest button#submit').show();
	  }
	});
});

var source = new EventSource('/events');
console.log('event source linked.\n');

source.addEventListener('message', function(e) {
	console.log(e.data);
	var message = JSON.parse(e.data);
	switch(message.type)
	{
		case EVENT_TYPES.PLAYLIST_CHANGED:
			refreshPlaylist();
		break;
		case EVENT_TYPES.USERLIST_CHANGED:
			refreshClientCount();
		break;
		case EVENT_TYPES.USERNAME_CHANGED:
			changeUsername(message.ID, message.username);
		break;
		case EVENT_TYPES.SONG_PROGRESS_CHANGED:
			setSongProgress(message.progress);
		break;
		case EVENT_TYPES.SONG_PLAYING:
			setSongPlaying(JSON.parse(message.song));
		break;
	}
}, false);


source.addEventListener('open', function(e) {
}, false);

source.addEventListener('error', function(e) {
  if (e.readyState == EventSource.CLOSED) {
    // Connection was closed.
    $('#playlist').text('Lost connexion to server.');
  }
}, false);

//radio control button events:

$('#play').click(function(e){
	e.preventDefault();
	$.get('/play', null);
});


$('#pause').click(function(e){
	e.preventDefault();
	$.get('/pause', null);
});


$('#stop').click(function(e){
	e.preventDefault();
	$.get('/stop', null);
});

$('#shuffle').click(function(e){
	e.preventDefault();
	$.get('/shuffle_playlist', null);
});

function setSongProgress(percent)
{
	console.log(percent+'%');
	$('.progressbar>div').css('width', percent+'%');
}

//what to do at the opening of the page.
$(document).ready(function(){
	refreshPlaylist();
	refreshClientCount();
	refreshCurrentPlayingSong();
	animateSongInfoCycle();
});