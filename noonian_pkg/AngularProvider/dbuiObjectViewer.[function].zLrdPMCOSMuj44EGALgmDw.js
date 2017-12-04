function ($parse, Dbui, NoonI18n) {
  return {
    templateUrl: 'dbui/reusable/core/object_viewer.html',
    restrict: 'E',
    scope: {
      theObject: '=',
      perspective: '='
    },
    
    controller: function($scope) {
      var theObject = $scope.theObject;
      var perspective = $scope.perspective;
    
      var className = theObject._bo_meta_data.class_name;
      
      $scope.labelGroup = theObject._bo_meta_data.field_labels;
      
      $scope.typeDescMap = theObject._bo_meta_data.type_desc_map;
    
      $scope.colClass = Dbui.columnClasses;
    
    
      var fieldCustomizations = perspective.fieldCustomizations || {};
      var displayCheckers = {};
      var contextFields = {};
    
      for(var f in fieldCustomizations) {
        if(fieldCustomizations[f].conditionalDisplay) {
          displayCheckers[f] = $parse(fieldCustomizations[f].conditionalDisplay);
          var dotPos = f.indexOf('.');
          if(dotPos > -1) {
              contextFields[f] = f.substring(0, dotPos);
          }
        }
      }
    
      $scope.shouldShow  = function(field) {
    
        var dc = displayCheckers[field];
    
        if(!dc){
          var fieldValue = theObject[field];
          if(angular.isArray(fieldValue)) {
            return fieldValue.length > 0;
          }
          else {
            return fieldValue != null;
          }
        }
        else  {
          var context = contextFields[field] ? _.get($scope.theObject, contextFields[field]) : $scope.theObject;
          return dc(context);
        }
      };
    }
  };
}