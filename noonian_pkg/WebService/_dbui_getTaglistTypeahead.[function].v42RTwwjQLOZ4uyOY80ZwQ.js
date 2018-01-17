function (db, queryParams, _, Q) {
    var td = queryParams.type_desc;
    var searchTerm = queryParams.search_term;
    var className = queryParams.class_name;
    var fieldName = queryParams.field_name;
    var exclude = queryParams.exclude;
    
    
    if(!td || !searchTerm || !className || !db[className]) {
        throw new Error('missing required parameters');
    }
    try {
        td = JSON.parse(td);
        // console.log('td: %j', td);
    }
    catch(err) {
        console.error(err);
    }
    
    if(!(exclude instanceof Array)) {
        exclude = exclude ? [exclude] : [];
    }
    var excludeMap = _.indexBy(exclude);
    
    var queryObj = {};
    queryObj[fieldName] = {$regex:searchTerm, $options:'i'};
    
    var queryProjection = {};
    queryProjection[fieldName] = 1;
    
    var promises = [
        db[className].find(queryObj, queryProjection).lean().exec()
    ];
    
    if(td.enum) {
        promises.push(db.Enumeration.findOne({name:td.enum}).lean().exec());
    }
    
    return Q.all(promises).then(function(resultArr) {
        var peerRecords = resultArr[0];
        var enumValues = resultArr[1];
        
        var regex = new RegExp(searchTerm);
        
        var ret = [];
        const appendValue = function(v) {
            if(!excludeMap[v] && regex.test(v)) {
                ret.push(v);
            }
        };
        if(enumValues && enumValues.values) {
            _.forEach(enumValues.values, appendValue);
        }
        
        _.forEach(peerRecords, function(pr) {
            _.forEach(pr[fieldName], appendValue);
        });
        
        return ret;
    });
    
}