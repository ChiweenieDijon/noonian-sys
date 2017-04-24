function ($scope, NoonAction) {

    $scope.invokeAction = function(actionObj) {
      NoonAction.invoke(actionObj);
    };
}