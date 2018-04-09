function (scope, ngModel, NoonI18n) {
    
    // console.log('relative_duration editor');
    
    const td = scope.typeDesc;
    
    if(!td.direction) {
        scope.selectDirection = true;
    }
    
    var initUnit = false;
    
    NoonI18n.getEnumerationValues('TimeDuration').$promise.then(function(enumValues) {
        
        if(td.units && td.units.length) {
            scope.units = [];
            
            //the strings in td.units become keys in keepVals:
            var keepVals = _.indexBy(td.units);
            
            //iterate through enumValues - retain order specified in TimeDuration enumeration.
            for(let i=0; i < enumValues.length; i++) {
                var curr = enumValues[i];
                if(keepVals[curr.value]) {
                    scope.units.push(curr);
                }
            }
        }
        else {
            //No filtering of units specified in typeDesc
            scope.units = enumValues;
        }
        
        if(initUnit) {
            scope.unit = scope.units[0].value;
        }
        
    });
    
    
    //1. Wire up converter for ng-model object  {date, unit}
    //   --> internal $viewValue representation {number, unit, direction}
    ngModel.$formatters.push(function(modelValue) {
        // console.log('relative_duration: Formatting model', modelValue);
        var viewValue;
        
        if(modelValue && modelValue.date) {
            viewValue = {
                unit:modelValue.unit
            };
            
            var now = moment();
            var targetDate = moment(modelValue.date);
            
            var diff = targetDate.diff(now, modelValue.unit);
            
            if(diff < 0) {
                //targetDate is BEFORE now
                viewValue.direction = 'past';
                viewValue.number = -diff;
            }
            else {
                viewValue.direction = 'future';
                viewValue.number = diff;
            }
        }
        else {
            viewValue = {
                direction: td.direction || 'past'
            }
            
            if(scope.units) {
               viewValue.unit = units[0].value;
            }
            else {
                initUnit = true;
            }
        }
        
        return viewValue;
        
    });
    
    //2. Wire up converter for internal $viewValue representation  {number, unit, direction}
    //  --> ng-model object {date, unit}
    ngModel.$parsers.push(function(viewValue) {
        if(viewValue.number != null) {
            const modelObj = {
                unit:viewValue.unit
            };
            
            if(viewValue.direction === 'past') {
                modelObj.date = moment().subtract(viewValue.number, viewValue.unit).format();
            }
            else {
                modelObj.date = moment().add(viewValue.number, viewValue.unit).format();
            }
            
            return modelObj;
        }
        
        //Don't want to default to "0 days ago" if 0 wasn't actually filled in
        return null;
    });
    
    //3. Wire up trigger for scope object --> $viewValue
    scope.$watch('unit+number+timeDirection', function() {
        //must *replace* the viewValue object in order for change to propogate to ng-model!
        if(scope.number != null) {
            const vv = {
                number:scope.number,
                unit:scope.unit,
                direction:scope.timeDirection
            };
            
            //Special case: picker is limited to future dates,
            //  but we're dealing with a past date.
            if(td.direction === 'future' && vv.direction === 'past') {
                //reset the direction if the unit or number changed
                if(vv.number !== ngModel.$viewValue.number || vv.unit !== ngModel.$viewValue.unit) {
                    vv.direction = 'future';
                    scope.showPastIndicator = false;
                }
            }
            
            ngModel.$setViewValue(vv);
        }
    }, 
    true);
    
    //4. Wire up callback for $viewValue update --> scope object
    ngModel.$render = function() {
        const vv = ngModel.$viewValue;
        scope.number = vv.number;
        scope.unit   = vv.unit;
        scope.timeDirection = vv.direction;
        
        //Special case: typeDesc limited direction picker to future,
        //  but that future date has passed
        if(td.direction === 'future' && vv.direction === 'past') {
            scope.showPastIndicator = true;
        }
        else {
            scope.showPastIndicator = false;
        }
    };
    
    
    return false;
}