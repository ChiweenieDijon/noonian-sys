function (db, req, Q) {
    
    const PassThrough = require('stream').PassThrough;
    const PackagingService = db._svc.PackagingService;
    const GridFsService = db._svc.GridFsService;
    
    const moment = require('moment');
    const multiparty = require('multiparty');
    const form = new multiparty.Form();
    
    const deferred = Q.defer();
    
    form.on('error', function(err) {
        console.error(err);
        deferred.reject(err);
    });
    
    form.on('part', function(part) {
        console.log('Processing upload part: %s', part.name);
        if(part.name === 'pkgStream') {
            
            //Split stream into two passthroughs so we can check it 
            // and also cache it to gridfs (so installation won't require a 2nd upload)
            const streamToCheck = new PassThrough();
            const streamToCache = new PassThrough();
            part.pipe(streamToCheck);
            part.pipe(streamToCache);
            
                
            Q.all([
                PackagingService.checkPackageStream(streamToCheck),
                GridFsService.saveFile(streamToCache, {type:'noonian-pkg', saved:moment().format()})
            ]).then(
                function([checkResult, cacheFileId]) {
                    checkResult.file_id = cacheFileId;
                    deferred.resolve(checkResult);
                },
                function(err) {
                    deferred.resolve({error:err, error_msg:err.message});
                }
            );
        }
        else {
            console.error('unknown part');
        }
        
    });
    
    // form.on('close', function() {});
    

    form.parse(req);
    
    return deferred.promise;
}