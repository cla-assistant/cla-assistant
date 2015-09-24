var removeToken = function(obj){
	try {
		obj = obj.toObject();
		if (obj.token) {
			delete obj.token;
		}
	} catch (e) {
		//do nothing
	}
	return obj;
};

module.exports = {
	cleanObject: function(obj){
		if(Object.prototype.toString.call( obj ) === '[object Array]' ) {
			var cleanedObj = [];
			obj.forEach(function(el){
				cleanedObj.push(removeToken(el));
			});
			return cleanedObj;
		} else {
			return removeToken(obj);
		}
	}
};
