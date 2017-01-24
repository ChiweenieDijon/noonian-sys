function ($scope, $stateParams, NoonI18n, DbuiAction, folderPerspective) {
    
    var className = $scope.boClass = $stateParams.className;
    
    //Load the labels for this class's fields
    // $scope.labels = NoonI18n.getBoLabelGroup(className);
    
    //Put folderPerspective (populated in $state object's "resolve" block) into scope
    $scope.folderPerspective = folderPerspective;
    
    // function(perspectiveObj, contextBo, actionObj, argsObj)
    $scope.invokeAction = DbuiAction.invokeAction.bind(DbuiAction, folderPerspective, null);
    
    if(folderPerspective.actions) {
        $scope.actionList = DbuiAction.unaliasActionList(folderPerspective.actions);
    }
    
    if(folderPerspective.title) {
        $scope.setPageTitle(folderPerspective.title);
    }
    else {
        $scope.setPageTitle('Folders '+className);
    }

}