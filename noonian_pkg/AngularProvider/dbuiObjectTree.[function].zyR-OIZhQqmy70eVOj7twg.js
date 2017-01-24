function ($timeout, $q, db, NoonI18n, DbuiAction, NoonWebService) {
  return {
    templateUrl: 'dbui/reusable/core/object_treelist.html',
    restrict: 'E',
    scope: {
      boClass: '=',
      perspective: '='
    },
    
    controller: function($scope) {
        
          var collapse = function() {
            this.expanded = false;
        
            if(this.children) {
              for(var i=0; i < this.children.length; i++) {
                this.children[i].collapse();
              }
            }
          };
        
        
          /** 
           * Generates a list of objects that represent the flattened path tree.
           */
          var createPathElements = function(prefix, indent, parent, prefixMap, elemArray) {
            var infoObj = prefixMap[prefix];
        
            var pathPieces = prefix.split($scope.pathSeperator);
        
            //First push my row...
            var me = {disp:pathPieces[pathPieces.length-1], prefix:prefix, count:infoObj.count, indent:indent, parent:parent, collapse:collapse};
            elemArray.push(me);
        
            //... then my children
            if(infoObj.children) {
              me.children = [];
              for(var i=0; i < infoObj.children.length; i++) {
                var child = infoObj.children[i];
                me.children.push(
                  createPathElements(child, indent+1, me, prefixMap, elemArray)
                );
              }
            }
        
            return me;
        
          };
          
          var boClass = $scope.boClass;
          var objectMetaData = db[boClass]._bo_meta_data;
          var perspective;
        
        
          $scope.labels = NoonI18n.getBoLabelGroup($scope.boClass);
          
          //Query stuff
          var queryOpts = {}, selectObj = {};
        
          $scope.$watch('perspective', function() {
            if(!$scope.perspective) return;
        
            perspective = $scope.perspective;
            
            if(perspective.sort) {
              queryOpts.sort = perspective.sort;
            }
            
            //Ask only for the fields we're showing
            for(var i=0; i <  perspective.fields.length; i++) {
                var f = perspective.fields[i];
                selectObj[f] = 1;
            }
            
            if(perspective.recordActions) {
                $scope.recordActionList = DbuiAction.unaliasActionList(perspective.recordActions);
            }
            
            $scope.filterDef = perspective.filter || {};
        
            $scope.dispFields = perspective.fields;
            $scope.pathField = perspective.pathField;
            $scope.viewField = perspective.viewField;
        
            $scope.pathSeperator = objectMetaData.type_desc_map.getTypeDescriptor($scope.pathField).seperator || '/';
            
            NoonWebService.call(
                'dbui/getAggregatePaths', 
                {
                    className:boClass, 
                    pathField:$scope.pathField, 
                    conditions:$scope.filterDef.query
                }
            ).then(function(resp) {
                var prefixMap = resp.result;
                var pathSep = $scope.pathSeperator;
                
                var pathElems = $scope.pathElements = [];
                
                var prefixes = Object.keys(prefixMap);
                prefixes.sort();
                
                //The top-level at the root
                var rootNode = {expanded:true};
                for(var i=0; i < prefixes.length; i++) {
                    if(prefixes[i].indexOf(pathSep) === -1) {
                        createPathElements(prefixes[i], 0, rootNode, prefixMap, pathElems);   
                    }
                }
            });

        
          }); //end $watch perspective
          
          
        
          $scope.toggleCollapse = function(elemObj) {
            if(elemObj.expanded)
              elemObj.collapse();
            else {
              elemObj.expanded = true;
        
              if(!elemObj.loaded) {
                elemObj.loaded = true;
                var BoModel = db[$scope.boClass];
        
                var queryDef = {};
                queryDef[$scope.pathField] = elemObj.prefix;
                
                
                 BoModel.find(queryDef, selectObj, queryOpts).$promise.then(function(results) {
                  if(results && results.length > 0) {
                    var newSection = [];
                    for(var i=0; i < results.length; i++) {
                      newSection.push(
                        {disp:results[i]._disp, indent:elemObj.indent+1, parent:elemObj, bo:results[i]}
                      );
                    }
        
                    var elemArr = $scope.pathElements;
                    var targetIndex = -1;
                    for(i=0; i < elemArr.length; i++) {
                      if(elemArr[i] === elemObj) {
                        targetIndex = i;
                        break;
                      }
                    }
                    var spliceFn = elemArr.splice.bind(elemArr, targetIndex+1, 0);
                    spliceFn.apply(elemArr, newSection);
        
                  }
                });
              }
            }
        
          }
        
        
        $scope.getValue = function(dataObj, field) {
            return _.get(dataObj, field);
        };
        
        $scope.getTypeDesc = function(field) {
            return objectMetaData.type_desc_map.getTypeDescriptor(field);
        };
        
        $scope.getFieldLabel = function(field) {
            var labels = $scope.labels;
            
            if(labels) {
                return (labels._abbreviated && labels._abbreviated[field]) || labels[field] || field;
            }
        
            return fieldName;
        };
        
        
        $scope.invokeRecordAction = function(dataObj, action, index) {
            //attach extra action "base parameters" from actionConfig 
            var params = {index:index, className:objectMetaData.class_name};
            
            //Invoke via DbuiAction, including 'index' parameter
            return DbuiAction.invokeAction(perspective, dataObj, action, params);
        };

    }
  };
}