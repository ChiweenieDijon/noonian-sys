function (auth, req, queryParams, db, I18n, Q, _) {
    var enumName = queryParams.name;
    
    if(!enumName) {
        throw new Error('missing required parameter');
    }
    
    return auth.getCurrentUser(req).then(function(currentUser) {
        return Q.all([
            I18n.getLabelGroup('db.enum.'+enumName, currentUser),
            db.Enumeration.findOne({name:enumName}).exec()
        ])
        .then(function(resultArr) {
            var lg = resultArr[0] || {};
            var enumeration = resultArr[1];
            
            if(!enumeration) {
                throw new Error('Invalid enumeration \''+enumName+'\'');
            }
            
            var ret = [];
            _.forEach(enumeration.values, function(val) {
                ret.push({
                   value: val,
                   label: (lg[val] || val)
                });
            });
            return {result:ret};
        });
    });
}