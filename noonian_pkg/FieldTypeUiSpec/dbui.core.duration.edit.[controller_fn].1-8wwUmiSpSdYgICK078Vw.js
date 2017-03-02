function ($scope, NoonI18n) {
    
    NoonI18n.getEnumerationValues('TimeDuration').$promise.then(function(enumValues){

      if($scope.typeDesc.units && $scope.typeDesc.units.length) {
        $scope.units = [];
        var keepVals = {};

        for(var i=0; i < $scope.typeDesc.units.length; i++) {
          keepVals[$scope.typeDesc.units[i]] = true;
        }

        for(var i=0; i < enumValues.length; i++) {
          var curr = enumValues[i];
          if(keepVals[curr.value] || ($scope.binding && $scope.binding.value && curr.value === $scope.binding.value.unit)) {
            $scope.units.push(curr);
          }
        }
      }
      else {
        $scope.units = enumValues;
      }
    });
    
}