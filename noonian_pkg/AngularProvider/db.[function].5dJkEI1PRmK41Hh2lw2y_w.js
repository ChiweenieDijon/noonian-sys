function ($http, $q, $injector, BusinessObjectModelFactory, TypeDescMap,BusinessObjectLabelGroup) {

  var initPromise = false; //Fulfilled when this factory is fully initialized
  var modelCache = {};  //Maps both BusinessObjectDef id AND classname to Model object
  var modelArr = [];


  /**
   * Convience to check/handle errors returned by webservice.
   * @private
   **/
  var handleWsCallError = function(method, md, response) {
    //An http error code was returned...
    console.log('ERROR response in ws call '+method, md, response);
    if(response.data.error)
      this.reject(response.data.error);
    else
      this.reject(response);
  };


  //modelStaticFunctions collection-level data access: find, count, batch update & remove.
  //  *these functions must be called w/ a this = _bo_meta_data
  var modelStaticFunctions = {

    /**
     * @function db.BusinessObjectModel.find
     * find a set of BusinessObjects
     *
     * @param {Object} conditions - query conditions (MongoDb style)
     * @param {?Object} projection - to include/exclude specific fields (MongoDb style)
     * @param {?Object} options - sort, limit, skip, group-by
     * @return {Array} A placeholder array that will be populated by the result objects on completion of call.
     *                 Contains $promise property that is fulfilled once webservice call is completed.
     */
    find:function(conditions, projection, options) {
      var deferred = $q.defer();

      var returnArr = [];
      returnArr.$promise = deferred.promise;

      var boMetaData = this._bo_meta_data;
      // console.log('Executing find: ', boMetaData, conditions, projection, options);

      var wsParams = {
        where:conditions,
        select:projection
      };
      _.assign(wsParams, options);

      $http({
        method:'GET',
        url:'db/'+boMetaData.class_name,
        params:wsParams
      }).then(

        function(response) {
          var responseData = response.data;

          if(responseData.error) {
            deferred.reject(responseData.error);
            return;
          }

          returnArr.nMatched = responseData.nMatched;
          returnArr._bo_meta_data = boMetaData;

          var MyModel = modelCache[boMetaData.class_name];

          _.forEach(responseData.result || [], function(resultObj) {
            if(!resultObj.group) {
                if(resultObj.__t) {
                    returnArr.push(new modelCache[resultObj.__t](resultObj));
                }
                else {
                    returnArr.push(new MyModel(resultObj));
                }
            }
            else {
              //Handle group-by
              var groupObj = {
                _id: resultObj._id,
                count: resultObj.count,
                group:[]
              };
              returnArr.push(groupObj);
              _.forEach(resultObj.group, function(obj) {
                groupObj.group.push(new MyModel(obj));
              });
            }
          });

          deferred.resolve(returnArr);
        },
        handleWsCallError.bind(deferred, 'db.find()', boMetaData)
      );

      return returnArr;
    },

    /**
     * @function db.BusinessObjectModel.findOne
     * find a single BusinessObject
     *
     * @param {Object} conditions - query conditions (MongoDb style)
     * @param {?Object} projection - to include/exclude specific fields (MongoDb style)
     * @param {?Object} options - sort, limit, skip, group-by
     * @return {BusinessObjectModel} A placeholder BusinessObjectModel instance that will be populated by the result object on completion of call.
     *                 Contains $promise property that is fulfilled once webservice call is completed.
     */
    findOne: function(conditions, projection, options) {
      // console.log('findOne', this, conditions);
      var deferred = $q.defer();

      var boMetaData = this._bo_meta_data;
      var MyModel = modelCache[boMetaData.class_name];

      var returnObj = new MyModel();
      returnObj.$promise = deferred.promise;

      var wsParams = {
        where:conditions
      };

      if(projection)
        wsParams.select = projection;
      if(options)
        _.assign(wsParams, options);

      wsParams.limit = 1;

      // console.log('Executing findOne: ', boMetaData, wsParams);
      $http({
        method:'GET',
        url:'db/'+boMetaData.class_name,
        params:wsParams
      }).then(

        function(response) {
          var responseData = response.data;

          if(responseData.error) {
            deferred.reject(responseData.error);
            return;
          }

          if(responseData.result && responseData.result.length > 0) {
            // _.assign(returnObj, responseData.result[0]);
            returnObj.initialize(responseData.result[0]);
            deferred.resolve(returnObj);
          }
          else {
            deferred.resolve(null);
          }
        },

        handleWsCallError.bind(deferred, 'db.findOne()', boMetaData)
      );

      return returnObj;
    },

    /**
     * @function db.BusinessObjectModel.count
     * count a set of BusinessObjects
     *
     * @param {Object} conditions - query conditions (MongoDb style)
     * @return {promise} fulfilled once webservice call is completed; resolves to a number representing count of matching objects.
     */
    count: function(conditions) {

    }

  };

  //modelInstanceFunctions - object-level db access: save, remove
  // called w/ this containing properties
  var modelInstanceFunctions = {
    /**
     * @function db.BusinessObjectModel#save
     * Create or update 'this' BO
     * @return {promise} fulfilled once webservice call is completed; resolves to 'this'
     */
    save:function() {
      var deferred = $q.defer();
      var boMetaData = this._bo_meta_data;
      var theObject = this;
      var copyObj = {};

      for(var f in boMetaData.type_desc_map) {
        copyObj[f] = this[f];
      }
      if(this._id) {
        copyObj._id = this._id;
      }


      $http({
        method:'POST',
        url:'db/'+boMetaData.class_name,
        data:copyObj
      }).then(
        function(response) {
          var responseData = response.data;

          if(responseData.error || !responseData.result) {
              deferred.reject(responseData.error || 'Object update failed; no result returned');
              return;
          }

          _.assign(theObject, responseData.result);

          deferred.resolve(theObject);
        },
        handleWsCallError.bind(deferred, 'db.save()', boMetaData)
      );
      return deferred.promise;
    },

    /**
     * @function db.BusinessObjectModel#remove
     * delete 'this' BO
     * @return {promise} fulfilled once webservice call is completed; resolves to ws response result
     */
    remove:function() {
      var deferred = $q.defer();
      var boMetaData = this._bo_meta_data;
      var theObject = this;

      if(!theObject._id) {
        deferred.reject('Unable to delete BusinessObject; missing _id');
        return deferred.promise;
      }

      $http({
        method:'DELETE',
        url:'db/'+boMetaData.class_name+'/'+theObject._id
      }).then(
        function(response) {
          var responseData = response.data;

          if(responseData.error || !responseData.result) {
            deferred.reject(responseData.error || 'Object update failed; no result returned');
            return;
          }

          deferred.resolve(responseData.result);
        },
        handleWsCallError.bind(deferred, 'db.remove()', boMetaData)
      );
      return deferred.promise;
    }
  };



  /**
   * Create the DB Model object for a particular business object definition:
   * the DB Model is akin to a mongoose model, used to query a particular class of BusinessObject's, and to update/delete objects
   * @private
   **/
  var createAndCacheModel = function(bod) {
      
      var instanceMemberFunctions = {};
      _.assign(instanceMemberFunctions, modelInstanceFunctions);
      
      var staticMemberFunctions = {};
      _.assign(staticMemberFunctions, modelStaticFunctions);
      
      if(bod._member_functions) {
          _.forEach(bod._member_functions, function(mf) {
              
              var fnString = mf.function;
              try {
                  var parsedFn;
                  eval("parsedFn = "+fnString);
                  if(typeof parsedFn !== 'function') {
                      throw new Error('eval resulted in non-function');
                  }
                  
                  var toAssign;
                  
                  if(mf.use_injection) {
                      toAssign = $injector.invoke(parsedFn);
                  }
                  else { 
                      toAssign = parsedFn;
                  }
                  
                  if(mf.is_static) {
                      staticMemberFunctions[mf.name] = toAssign;
                  }
                  else {
                      instanceMemberFunctions[mf.name] = toAssign;   
                  }   
              }
              catch(err) {
                  console.error("function parse failed", err);
              }
          });
      }
      
      var superModel = null;
      
      if(bod.superclass) {
          superModel = modelCache[bod.superclass._id];
      }
      
      var NewModel = BusinessObjectModelFactory.getConstructor(
          bod.definition, 
          bod.class_name, 
          bod._field_labels, 
          bod._id, 
          superModel, 
          instanceMemberFunctions, 
          staticMemberFunctions
      );
      
      modelCache[bod._id] = modelCache[bod.class_name] = NewModel;
      modelArr.push(NewModel);
  };


  modelCache.getModelArr = function() {
      return modelArr;
  }

  /**
   * @function db.init
   *  Initialize db layer on start-up; calls web service to obtain system metadata, populates the api model objects
   * @return {promise} fulfilled on completion
   */
  modelCache.init = function() {

    if(!initPromise) {
      console.log('initializing db factory');

      initPromise =
        $http({
          method:'GET',
          url:'ws/dbui/getSysMetadata'
        }).then(

          function(response) {
            var responseData = response.data || {};

            if(responseData.error) {
              throw responseData.error;
            }

            var bodArray = responseData.result;

            //Get superclasses first on the list
            bodArray.sort(function(x,y) {
              if(!y.abstract === !x.abstract) return 0;
              else if(y.abstract && !x.abstract) return 1;
              else return -1;
            });

            _.forEach(bodArray, function(bod) {
              createAndCacheModel(bod);
            });
            
            TypeDescMap._init(modelCache);
            BusinessObjectLabelGroup._init(modelCache);

          }
        );


    }
    return initPromise;
  };
  
  //Return the API for the db layer:
  return modelCache;

}