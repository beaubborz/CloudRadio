var me;

$(document).ready()
{
	me = getUser();
	$('#myself').text(me.username);
	$('#myself').attr('userid', getUser().id);
}

$('#myself').click(function()
{
	var textfield = $(this).siblings('input');
	textfield.val($(this).text());
	$(this).addClass('hidden');
	textfield.removeClass('hidden');
	textfield.removeClass('error');
	textfield.focus();
});

$('#myself+input').focusout(function(){
	if($(this).val().match("^([a-zA-Z0-9]| )*$"))
	{
		$.post('/set_username', {username: $(this).val()}, function(){
			//username set.
		});
		$(this).addClass('hidden');
		$('#myself').removeClass('hidden');
	}
	else
	{
		$(this).addClass('error');
	}
});

function getUser(ID)
{
	var u;
	if(ID == undefined)
	{
		ID = null;
	}
	$.ajax('/get_user',
	{
        type: 'GET',
        async: false,
        data: {id:ID}, 
        dataType: 'json',
        success: function(data)
        {
			u = data;
		}
	});
	if(u==undefined || u==null)
		u = {username: 'error'};
	return u;
}

//update client count:
function refreshClientCount()
{
	$.get('/client_count', function(data){
		var number = parseInt(data);
		var text = 'error while getting client count.';
		if(number == 0)
			text = 'No clients connected!!';
		else if(number == 1)
			text = '1 client';
			else
			text = number+' clients';

		$('#client_counter').text(text);
	});
}

function changeUsername(ID, username)
{
	$('.username[userid="'+ID+'"]').text(username);
}