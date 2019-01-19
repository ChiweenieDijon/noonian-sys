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
    
    throw new Error('missing required parameters');
}