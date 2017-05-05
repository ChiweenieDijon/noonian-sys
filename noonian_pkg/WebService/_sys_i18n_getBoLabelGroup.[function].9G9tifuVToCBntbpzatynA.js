function (auth, req, queryParams, I18n) {
    
    if(!queryParams.className) {
        return {result:{}};
    }
    
    return auth.getCurrentUser(req).then(function(currentUser) {
        return I18n.getBoLabelGroup(queryParams.className, currentUser).then(function(fieldLabels) {
            return {result:fieldLabels};
        })
    });
    
}