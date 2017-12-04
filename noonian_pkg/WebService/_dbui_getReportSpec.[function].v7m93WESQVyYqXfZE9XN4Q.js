function (queryParams, db, auth, req, i18n, Q) {
    var reportId = queryParams.id;
    
    if(!reportId) {
        throw new Error('missing required parameters');
    }
    
    var result = {};
    
    return Q.all([
        auth.getCurrentUser(req),
        db.DbuiReport.findOne({_id:reportId}).lean().exec()
    ])
    .then(function(resultArr) {
        var currUser = resultArr[0];
        result.reportSpec = resultArr[1];
        
        return i18n.getLabelGroup('dbui.report.'+result.reportSpec.name, currUser);
    })
    .then(function(labels) {
        result.labels = labels;
        return result;
    });
}