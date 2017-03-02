function (NoonI18n) {
    NoonI18n.getEnumerationValues('TimeDuration')
      .$promise.then(function(result) {
        var labelMap = {};
        for(var i=0; i < result.length; i++) {
          labelMap[result[i].value] = result[i].label;
        }
        $scope.enumLabels = labelMap;
    });
}