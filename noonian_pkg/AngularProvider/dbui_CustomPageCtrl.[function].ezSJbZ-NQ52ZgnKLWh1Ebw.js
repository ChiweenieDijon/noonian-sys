function ($scope, $state, $stateParams) {
    // console.log('dbui_CustomPageCtrl invoked for', $state);
    // $scope.resourcePath = decodeURIComponent($stateParams.resourcePath);
    if($stateParams.key) {
        $scope.pageKey = $stateParams.key;
    }
    else {
        $scope.resourcePath = $stateParams.resourcePath;
    }
    
}