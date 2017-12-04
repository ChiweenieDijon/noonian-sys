function (scope) {
    var i=1;
    scope.$watch('formStatus.isDirty', function(fs) {
        if(!fs) {
            //Set parent to pristine whenever child object-editor reports back clean
            scope.linkStatus = i++; 
        }
    });
    
    
    return true;
}