function (db, auth, req, Q, _) {
    
    
    return auth.getCurrentUser(req).then(function(currUser) {
        var ENGLISH_ID='-9vPfv2lEeSFtiimx_V4dw';
        var language = (currUser.language && currUser.language._id) || ENGLISH_ID;
        
        return Q.all([
            db.BusinessObjectDef.find({}).lean().exec(),
            db.MemberFunction.find({applies_to:{$in:['client', 'both']}}).lean().exec(),
            db.LabelGroup.find({key:/^sys\.dbui\.bo\..+/, language:language}).lean().exec()
        ]);
    })
    .then(function(resultArr) {
        var allBods = resultArr[0];
        var memberFns = resultArr[1];
        var labelGroups = resultArr[2];
        
        var bodMap = _.indexBy(allBods, '_id');
        _.forEach(memberFns, function(memFn) {
            if(memFn.business_object && memFn.business_object._id) {
                var bod = bodMap[memFn.business_object._id];
                bod._member_functions = bod._member_functions || [];
                bod._member_functions.push(memFn);
                delete memFn.business_object;
                delete memFn.applies_to;
            }
        });
        bodMap = _.indexBy(allBods, 'class_name');
        _.forEach(labelGroups, function(lg) {
            var className = lg.key.split('.').pop();
            if(bodMap[className]) {
                bodMap[className]._field_labels =  lg.value;
            }
        });
        
        return {result:allBods};
    });
}