function (db, auth, req, Q, _) {
    var isAdmin;
    
    return auth.getCurrentUser(req).then(function(currUser) {
        const ENGLISH_ID='-9vPfv2lEeSFtiimx_V4dw';
        const language = (currUser.language && currUser.language._id) || ENGLISH_ID;
        
        const myRoles = _.pluck(currUser.roles, '_id');
        isAdmin = myRoles.indexOf('FnQ_eBYITOSC8kJA4Zul5g') > -1;
        
        return Q.all([
            db.BusinessObjectDef.find({}).lean().exec(),
            db.MemberFunction.find({applies_to:{$in:['client', 'both']}}).lean().exec(),
            db.LabelGroup.find({key:/^sys\.dbui\.bo\..+/, language:language}).lean().exec(),
            isAdmin ? [] : db.DataAccessControl.find({rolespec:{$satisfiedBy:myRoles}}).lean().exec()
        ]);
    })
    .then(function([allBods, memberFns,labelGroups,dacList]) {
        
        if(!isAdmin) {
            //Special processing for non-admin users:
            
            //(1) compute permission summary from DACs
            const dacMap = {};
            for(var dac of dacList) {
                let boId = dac.business_object._id;
                let m = dacMap[boId] = dacMap[boId] || {};
                let isConditional = !!dac.condition;
                
                let permission = isConditional ? 'conditional' : true;
                let c,r,u,d;
                isConditional ? ({c,r,u,d} = m) : (c=r=u=d=true);
                
                dac.allow_create && (m.c = c || permission);
                dac.allow_read   && (m.r = r || permission);
                dac.allow_update && (m.u = u || permission);
                dac.allow_delete && (m.d = d || permission);
            }
            console.log('DAC MAP: %j', dacMap);
            
            //(2) filter out BOD list to include only those w/ some permission
            //    and augment w/ permission description
            var filteredList = [];
            for(let bo of allBods) {
                let perm = dacMap[bo._id]; 
                if(perm) {
                    bo._access_permissions = {create:perm.c,read:perm.r,update:perm.u,delete:perm.d};
                    filteredList.push(bo);
                }
            }
            allBods = filteredList;
        }
        else {
            //Is an admin: augment w/ fully permissive 
            let perm = {create:true,read:true,update:true,delete:true};
            for(let bo of allBods) {
                bo._access_permissions = perm;
            }
        }
        
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