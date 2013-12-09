$(document).on('mouseenter', '.upvote, .downvote', function(){
	$(this).addClass('hovered');
});

$(document).on('mouseleave', '.upvote, .downvote', function(){
	$(this).removeClass('hovered');
});

$(document).on('click', '.upvote', function(){
	var song_id = $(this).parents('li').attr('song_id');
	$.get('/upvote?id='+song_id, function(){
		console.log('upvote executed.');
	});
});


$(document).on('click', '.downvote', function(){
	var song_id = $(this).parents('li').attr('song_id');
	$.get('/downvote?id='+song_id, function(){
		console.log('downvote executed.');
	});
});