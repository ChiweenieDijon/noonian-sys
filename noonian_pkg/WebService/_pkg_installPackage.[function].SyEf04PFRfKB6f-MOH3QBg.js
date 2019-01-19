function (queryParams, db, postBody) {
    const PackagingService = db._svc.PackagingService;
    const GridFsService = db._svc.GridFsService;
    
    if(queryParams.id) {
        //Old way of installing file attached to a BusinessObjectPackage
        return PackagingService.applyPackage(queryParams.id).then(function(result) {
            return {message:'applied package '+result};
        });
    }
    
    if(queryParams.upload_id) {
        return GridFsService.getFile(queryParams.upload_id).then(fileObj=>{
            return PackagingService.installPackageStream(fileObj.readstream, postBody);
        });
    }
    
    if(queryParams.key && queryParams.repo && queryParams.version) {
        const request = require('request');
        
        return db.RemotePackageRepository.findOne({_id:queryParams.repo}).then(repo=>{
           if(!repo) {
               throw new Error('invalid repository '+queryParams.repo);
           }
           
            const fullUrl = `${repo.url}/ws/package_repo/getPackage?key=${queryParams.key}&version=${queryParams.version}`;
    		var requestParams = {
                uri:fullUrl,
                auth:{bearer:repo.auth.token},
                rejectUnauthorized: false
            };
            
            return PackagingService.installPackageStream(request.get(requestParams), postBody);
        });
    }
    
    throw new Error('missing required parameters');
}