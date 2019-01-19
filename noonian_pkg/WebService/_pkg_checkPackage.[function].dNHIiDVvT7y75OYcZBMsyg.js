function (db, queryParams, Q) {
    
    console.log(queryParams);
    if(!queryParams.repo || !queryParams.key) {
        throw 'Missing required parameters';
    }
    
    const request = require('request');
    const PackagingService = db._svc.PackagingService;
    
    
    const repo = queryParams.repo;
    const key = queryParams.key;
	
	return db.RemotePackageRepository.findOne({_id:repo}).then(rpr=>{
	    const deferred = Q.defer();
		request(
			{
				method:'GET',
				uri:`${rpr.url}/ws/package_repo/getMetaData?keys=${key}`,
				auth:{bearer:rpr.auth.token},
				json:true
			},
			function(err, httpResponse, body) {
				if(err || body.error) {
					console.error(err || body.error);
					return deferred.reject(err || body.error);
				}
				
				if(body && body.length) {
				    deferred.resolve(PackagingService.checkPackage(body[0]))
				}
				else {
				    deferred.reject(`Metadata not found for pkg ${key} in repo ${rpr.name}`);
				}
			}
		);
		return deferred.promise;
		
	});
    
}