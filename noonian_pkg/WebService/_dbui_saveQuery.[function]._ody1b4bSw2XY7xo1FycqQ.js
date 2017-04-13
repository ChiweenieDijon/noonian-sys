function (queryParams, db, req) {
    var boClass = queryParams.class_name;
    var perspectiveName = queryParams.perspective;
    var title = queryParams.title;
    var toSave = queryParams.theQuery;
    
    if(!boClass || !perspectiveName || !toSave) {
        throw new Error('Missing required parameters');
    }
    
    toSave = JSON.parse(toSave);
    
    var currUserId = req.user._id;
    
    var configKey = 'sys.dbui.perspective.'+perspectiveName+'.'+boClass;
    return db.Config.findOne({key:configKey, user:currUserId}).then(function(cfg) {
        if(!cfg) {
            cfg = new db.Config({key:configKey, user:{_id:currUserId}, value:{}});
        }
        
        var list = cfg.value.list = cfg.value.list || {};
        var queryList = list.savedQueries = list.savedQueries || [];
        queryList.push({
            title:title,
            query:toSave
        });
        cfg.markModified('value');
        return cfg.save();
    })
    .then(function(cfg) {
        return {result:'success', queryList:cfg.value.list.savedQueries};
    })
    ;
}