function (auth, req, queryParams, I18n, Q) {
    var lang = queryParams.language_code;
    
    var firstPromise;
    
    if(lang) {
        firstPromise = db.Language.findOne({code:lang}, {_id:1}).lean.exec().then(function(result) {
            return {language:result};
        });
    }
    else {
        firstPromise = auth.getCurrentUser(req); 
    }
    
    return firstPromise.then(function(currentUser) {
        return I18n.getLabelGroup(queryParams.key, currentUser).then(function(lg) {
            return {result:lg};
        });
    });
    
    
}