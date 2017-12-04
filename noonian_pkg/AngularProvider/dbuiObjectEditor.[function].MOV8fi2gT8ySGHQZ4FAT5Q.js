function (Dbui, I18n) {
  return {
      
    templateUrl: 'dbui/reusable/core/object_editor.html',
    
    restrict: 'E',
    scope: {
      theObject: '=',  //Object being displayed (a model instance from datsource)
      perspective: '=',
      formStatus: '=?'
    },
    
    link:function(scope) {
        
        scope.$watch('editorForm.$dirty', function(isDirty) {
            //Set isDirty to true when we the form becomes dirty;
            // (unset is done externally)
            
            if(scope.formStatus && isDirty) {
                scope.formStatus.isDirty = true;
            }
        });
        
        scope.$watch('formStatus.isDirty', function(isDirty) {
            if(!isDirty) {
                scope.editorForm.$setPristine();
            }
        });
        
        //the dbui-field-editor updates linkStatus when it's link function is complete
        // use that to initialize "pristine/dirty" status of the form
        // (the async stuff in the field editor's link fn seems to make the ngModel dirty/pristine stuff act funky)
        scope.linkStatus = {};
        scope.$watch('linkStatus', function(ls) {
            scope.editorForm.$setPristine();
            if(scope.formStatus) scope.formStatus.isDirty = false;
        }, true);
    },
    
    controller:function($scope, $parse) {

      var theObject = $scope.theObject;
      var perspective = $scope.perspective;

      var className = theObject._bo_meta_data.class_name;
      
      $scope.labelGroup = theObject._bo_meta_data.field_labels;
      
      $scope.typeDescMap = theObject._bo_meta_data.type_desc_map;


      $scope.colClass = Dbui.columnClasses;

      //Set up getter/setter function with ngModel;
      // allows us to have dotted subfields in the layout,
      // resulting in editable subfields
      var getterSetterFn = function(fieldName, value) {

        if(arguments.length > 1) {
          //called as setter
          // console.log('setter!!!!!!!', fieldName, value);
          _.set(theObject, fieldName, value);
        }

        return _.get(theObject, fieldName);

      };

      var getterSetter = $scope.getterSetter = {};

      //Traverse the normalized layout: section -> rows -> field names
      _.forEach(perspective.layout, function(section) {
        _.forEach(section.rows, function(row) {
          for(var i=0; i < row.length; i++) {
            var f = row[i];
            getterSetter[f] = getterSetterFn.bind(null, f);
          }
        });
      });


      var fieldCustomizations = perspective.fieldCustomizations || {};
      var displayCheckers = {};
      var contextFields = {}; //maps dotted field names present in fieldCustomizations to the base field name
      
      
      var requiredFields = {};
      var reqExpression = '';
      var reqChecker;
      var reqWatcher = function() {
          $scope.formStatus.isValid = !!reqChecker($scope.theObject);
      };

      for(var f in fieldCustomizations) {
        if(fieldCustomizations[f].conditionalDisplay) {
          displayCheckers[f] = $parse(fieldCustomizations[f].conditionalDisplay);
          var dotPos = f.indexOf('.');
          if(dotPos > -1) {
              contextFields[f] = f.substring(0, dotPos);
          }
        }
        
        if(fieldCustomizations[f].required) {
            requiredFields[f] = true;
            reqExpression += (reqExpression ? ' && ' : '')+f;
            $scope.$watch('theObject.'+f, reqWatcher);
        } 
      }
      
      if(reqExpression) {
          reqChecker = $parse(reqExpression);
      }
      
      $scope.isRequired = function(field) {
          if(!requiredFields[field]) {
              return false;
          }
          else {
              return !_.get($scope.theObject, field);
          }
      };

      $scope.shouldShow  = function(field) {
          if(!$scope.getTypeDesc(field)) {
              return false;
          }
          var dc = displayCheckers[field];
          if(!dc) {
              return true;
          }
          else {
              var context = contextFields[field] ? _.get($scope.theObject, contextFields[field]) : $scope.theObject;
              return dc(context);
          }
      };
      
      var tdCache = {};
      $scope.getTypeDesc = function(field) {
          if(!tdCache[field]) {
              tdCache[field] = $scope.typeDescMap.getTypeDescriptor(field);
          }
          
          return tdCache[field];
      };

    }
  };
}