function (NoonI18n) {
    NoonI18n.getEnumerationValues('TimeDuration')
      .$promise.then(function(result) {
        var labelMap = _.indexBy(result, 'value');
        var dv = $scope.displayValue;
        
        if(dv && dv.date) {
            var now = moment();
            
            var targetDate = moment(dv.date);
            var unit = dv.unit || 'hours';
            var unitLabel = labelMap[unit].label;
            
            var diff = targetDate.diff(now, unit);
            
            if(diff < 0) {
                //targetDate is BEFORE now
                $scope.dispString = (-diff)+' '+unitLabel+' Ago';
            }
            else {
                $scope.dispString = 'In '+diff+' '+unitLabel;
            }
        }
        
    });
}