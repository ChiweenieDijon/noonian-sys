function (db, queryParams,_) {
    var pcId = queryParams.id;
    
    if(!pcId) {
        throw new Error('missing required parameters');
    }
    
    return db.PackageConflict.findOne({_id:pcId}).then(function(pc) {
        if(!pc || !pc.package_version_id || !pc.object_class || !db[pc.object_class] || !pc.object_id) {
            throw new Error('invalid PackageConflict');
        }
        
        return db[pc.object_class].findOne({_id:pc.object_id}).then(function(targetObj) {
            var stomper = pc.merged_object;
            delete stomper.__ver;
            _.assign(targetObj, stomper);
            return targetObj.save({useVersionId:pc.package_version_id, skipTriggers:true}, null);
        })
        .then(function() {
            return {message:'Success: local version='+pc.package_version_id};
        })
        ;
    });
}