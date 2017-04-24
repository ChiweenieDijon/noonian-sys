function (req, config, db, auth, DbuiMenuBuilder, Q, _) {
    var configKey = 'sys.dbui.sidebar_menu';
    var currUser;
    
    return auth.getCurrentUser(req).then(function(u) {
        currUser = u;
        
        var configQuery = {
            key:configKey
        };
        
        var isAdmin = false; //special case
        _.forEach(currUser.roles, function(r) {
            if(r._id === 'FnQ_eBYITOSC8kJA4Zul5g') {
                isAdmin = true;
            }
        });
        
        if(!isAdmin) {
            configQuery.$or = [
                {rolespec:{$satisfiedBy:currUser.roles}},
                {user:currUser._id}
            ];
        }
        
        return db.Config.find(configQuery);
    })
    .then(function(matchingConfigs) {
        var matchedKeys = {};
        var menuKeys = [];
        var menuPromises = [config.getCustomizedParameter(configKey, req.user._id)];
        
        _.forEach(matchingConfigs, function(c) {
            if(!matchedKeys[c.value]) {
                matchedKeys[c.value] = true;
                menuKeys.push(c.value);
                menuPromises.push(DbuiMenuBuilder.buildMenu(c.value, currUser));
            }
        });
        
        return Q.all(menuPromises).then(function(menuArr) {
            var result = {_primary:menuArr[0]};
            for(var i=1; i < menuArr.length; i++) {
                var menuKey = menuKeys[i-1];
                result[menuKey] = menuArr[i];
            }
            return result;
        })
        
        
    })
    
    ;
    
    return Q.all([
        auth.getCurrentUser(req),
        config.getCustomizedParameter(configKey, req.user._id)
    ])
    .then(function(resultArr) {
        var currUser = resultArr[0];
        var menuKey = resultArr[1];
        return DbuiMenuBuilder.buildMenu(menuKey, currUser);
    });
    
}