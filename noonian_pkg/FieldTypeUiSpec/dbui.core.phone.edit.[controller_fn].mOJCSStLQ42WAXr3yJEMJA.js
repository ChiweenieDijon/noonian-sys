function ($scope, phoneFormatFilter) {
    $scope.$watch('binding.value', function(value) {
        if(value) {
            //remove all non-digits
            var pieces = value.split(/\D/);
            value = pieces.join('');
            var proper = phoneFormatFilter(value);
            
            if(proper !== $scope.binding.value) {
                $scope.binding.value = proper;
            }
        }
    }); 
}