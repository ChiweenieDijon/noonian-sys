function ($scope, phoneFormatFilter) {
    
    
    
    $scope.prettyNumber = function(dispValue) {
        if(angular.isDefined(dispValue)) {
            //Setter
            if(dispValue) {
                var pieces = dispValue.split(/\D/);
                $scope.binding.value = pieces.join('');
            }
            else if($scope.binding.value) {
                $scope.binding.value = '';
            }
        }
        else {
            //getter
            if($scope.binding.value) {
                return phoneFormatFilter($scope.binding.value);
            }
            return '';
        }
    };
    
}