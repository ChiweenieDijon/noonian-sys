function (db, req, Q) {
    
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
            db._svc.PackagingService.checkPackage(part).then(
                 result=> {
                    deferred.resolve(result); 
                 },
                 err=> {
                     deferred.reject(err);
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