function (auth, req, queryParams, I18n) {
    
    return auth.getCurrentUser(req).then(function(currentUser) {
        return I18n.getLabelGroup(queryParams.key, currentUser).then(function(lg) {
            return {result:lg};
        });
    });
    
    
}