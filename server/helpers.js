exports.isEmpty = function(elem)
{
	return elem == null || elem == undefined || elem == '';
}

exports.arrayKeys = function(array)
{
	var ret = new Array();
	for(var i in array)
	{
		ret.push(i);
	}
	return ret;
}

exports.arrayValues = function(array)
{
	var ret = new Array();
	for(var i in array)
	{
		ret.push(array[i]);
	}
	return ret;
}