function ($http, $q) {

	return {
		getParameter: function(paramKey) {
			var deferred = $q.defer();

			$http.get('config/param/'+paramKey)
				.success(function(data) {
					var responseObj = angular.fromJson(data);
					if(responseObj.error) {
						deferred.reject(responseObj.error);
					}
					else {
						deferred.resolve(responseObj.result);
					}
				})
				.error(function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},
		
		customizeParameter: function(paramKey, value) {
		    var deferred = $q.defer();

			$http.post('config/customizeParam/'+paramKey, {value:value})
				.success(function(data) {
				    console.log('customizeParam result', data);
					var responseObj = angular.fromJson(data);
					if(responseObj.error) {
						deferred.reject(responseObj.error);
					}
					else {
						deferred.resolve(responseObj.result);
					}
				})
				.error(function(err) {
					deferred.reject(err);
				});

			return deferred.promise;
		    
		}

	};

}