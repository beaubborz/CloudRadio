var users = {};

exports.getUserIDFromRequest = function(request)
{
	return request.connection.remoteAddress;
}

exports.getUserCount = function()
{
	return Object.keys(users).length;
}

exports.addUser = function(ID, username)
{
	if(username == null)
	{
		username = 'User '+(exports.getUserCount()+1);
	}
	users[ID] = exports.createUser(username);
}

exports.createUser = function(name)
{
	return {
		username:name 
	};
}

exports.changeUsername = function(ID, newUsername)
{
	if(exports.userExists(ID))
	{
		users[ID].username = newUsername;
	}
}

exports.getUserByID = function(ID)
{
	return users[ID];
}

exports.userExists = function(ID)
{
	return typeof users[ID] != 'undefined';
}

exports.getAllUsers = function()
{
	var userlist = new Array();
	for(var u in users)
	{
		userlist.push(u);
	}
	return userlist;
}

exports.removeUser = function(ID)
{
	if(exports.userExists(ID))
	{
		delete users[ID];
	}
}

exports.getUserByRequest = function(req)
{
	return users[exports.getUserIDFromRequest(req)];
}