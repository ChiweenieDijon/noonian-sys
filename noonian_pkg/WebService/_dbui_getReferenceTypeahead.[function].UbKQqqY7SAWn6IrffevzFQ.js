function (db, queryParams, Q, _) {
    var MAX_RESULTS = 10;
    var className = queryParams.class_name;
    var searchTerm = queryParams.search_term;
    var filter = queryParams.filter;
    
    if(!className || !searchTerm) {
        throw new Error('missing parameters');
    }
    
    if(filter) {
        filter = JSON.parse(filter);
    }
    
    var Model = db[className];
    var firstPromise;
    
    if(Model._bo_meta_data.type_desc_map._disp) {
        var queryObj = {__disp:{$regex:searchTerm, $options:'i'}};
        if(filter) {
            queryObj = {$and:[filter,queryObj]};
        }
        firstPromise = Model.find(queryObj, {__disp:1}).limit(MAX_RESULTS).sort({__disp:'asc'}).lean();
    }
    else {
        firstPromise = Q([]);
    }
    
    return firstPromise.then(function(topResults) {
        var ret = [];
        var ids = [];
        
        _.forEach(topResults, function(ref) {
            ret.push({
                _disp:ref.__disp,
                _id:ref._id
            });
            ids.push(ref._id);
        });
        
        if(ret.length == MAX_RESULTS) {
            return ret;
        }
        
        var queryObj = {$and:[{_id:{$nin:ids}}, {$fulltextsearch:searchTerm}]};
        if(filter) {
            queryObj.$and.push(filter);
        }
        
        return Model.find(queryObj).limit(MAX_RESULTS-ret.length).then(function(nextResults) {
            _.forEach(nextResults, function(r) {
                ret.push({
                    _disp:r._disp,
                    _id:r._id
                });
            });
            return ret;
        });
        
    });
}