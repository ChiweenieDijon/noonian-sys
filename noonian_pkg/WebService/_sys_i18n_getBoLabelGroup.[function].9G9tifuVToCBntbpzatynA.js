function (req, queryParams, I18n) {
    
    if(!queryParams.className) {
        return {result:{}};
    }
    
    return I18n.getBoLabelGroup(queryParams.className, req.user).then(function(fieldLabels) {
        return {result:fieldLabels};
    });
    
}