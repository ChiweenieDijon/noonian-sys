function (db, queryParams,_) {
    var pcId = queryParams.id;
    
    if(!pcId) {
        throw new Error('missing required parameters');
    }
    
    var VersionId = db._svc.PackagingService.VersionId;
    if(!VersionId) {
        throw new Error('upgrade to noonain platform required');
    }
    
    return db.PackageConflict.findOne({_id:pcId}).then(function(pc) {
        if(!pc || !pc.installed_version_id || !pc.package_version_id || !pc.object_class || !db[pc.object_class] || !pc.object_id) {
            throw new Error('invalid PackageConflict');
        }
        
        //Create merged version id
        var pkgVer = new VersionId(pc.package_version_id);
        var localVer = new VersionId(pc.installed_version_id);
        var mergedVer = VersionId.merge(pkgVer, localVer);
        
        return db[pc.object_class].findOne({_id:pc.object_id}).then(function(targetObj) {
            var mergedObj = pc.merged_object;
            delete mergedObj.__ver;
            _.assign(targetObj, mergedObj);
            return targetObj.save({useVersionId:mergedVer.toString(), skipTriggers:true}, null);
        })
        .then(function() {
            return {message:'Success: merged version='+mergedVer.toString()};
        })
        ;
    });
}