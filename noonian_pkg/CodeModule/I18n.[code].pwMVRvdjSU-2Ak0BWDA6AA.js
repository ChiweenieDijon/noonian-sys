function (db, _, Q) {
    var exports = {};
    var ENGLISH_ID='-9vPfv2lEeSFtiimx_V4dw';

    /**
     * @private
     */
    var autogenLabelGroup = function(className) {
      var key = 'sys.dbui.bo.'+className;
      
      var typeDescMap;
      
      if(db[className]) {
          typeDescMap = db[className]._bo_meta_data.type_descriptor;
      }
      else if(className.indexOf('#') > -1) {
          var hashPos = className.indexOf('#');
          var baseClass = className.substring(0, hashPos);
          var field = className.substring(hashPos+1);
          
          var td = db[baseClass] && db[baseClass]._bo_meta_data.type_descriptor[field];
          
          if(td instanceof Array) {
              td = td[0]
          }
          
          if(td && td.type === 'composite') {
              typeDescMap = td.type_desc_map;
          }
      }
    
      if(typeDescMap) {
        console.log("Auto-generating LabelGroup for %s", className);
         //Create a LabelGroup for i18n
         var lg = new db.LabelGroup({
           key:key,
           language:{_id:'-9vPfv2lEeSFtiimx_V4dw'},
           value:{}
         });
    
         for(var f in typeDescMap) {
           if(f.indexOf('_') !== 0) {
             lg.value[f] = _.startCase(f);
           }
         }
    
         return lg.save();
       }
       return null;
    };
    
    /**
     * I18n.getLabelGroup
     * Retrieve label group for a particular user.
     */
    exports.getLabelGroup = function(key, user) {
      var lang = user && user.language ? user.language._id : ENGLISH_ID; //default to english
    
      return db.LabelGroup.findOne({key:key, 'language._id':lang}).then(function(lg){
        return lg && lg.value;
      });
    
    };
    
    /**
     * I18n.aggregateLabelGroups
     * Retrieve multiple label groups for a particular user.
     */
    exports.aggregateLabelGroups = function(keyArr, user) {
      var lang = user && user.language ? user.language._id : ENGLISH_ID; //default to english
    
      return db.LabelGroup.find({key:{$in:keyArr}, 'language._id':lang}).then(function(lgArr){
          var result = {};
          _.forEach(lgArr, function(lg) {
              result[lg.key] = lg.value;
          });
        return result;
      });
    
    };
    
    /**
     * I18n.getBoLabelGroup
     * *resolves immediate reference sub-fields; TODO also resolve inheritance!
    */
    exports.getBoLabelGroup = function(className, user) {
      var lang = user && user.language ? user.language._id : ENGLISH_ID; //default to english
    
    
      var keyPrefix = 'sys.dbui.bo.';
      var baseKey = keyPrefix+className;
    
      var boMetaData;
      
      if(db[className]) {
          boMetaData = db[className]._bo_meta_data;
      }
      else if(className.indexOf('#') > -1) {
          var hashPos = className.indexOf('#');
          var baseClass = className.substring(0, hashPos);
          var field = className.substring(hashPos+1);
          
          var td = db[baseClass] && db[baseClass]._bo_meta_data.type_descriptor[field];
          
          if(td instanceof Array) {
              td = td[0]
          }
          
          if(!td || td.type !== 'composite') {
              throw new Error('Invalid class name: '+className);
          }
          
          boMetaData = {
              type_descriptor:td.type_desc_map
          };
      }
      else {
          throw new Error('Invalid class name: '+className);
      }
    
      var queryKeyList = [baseKey]; //LabelGroup keys we'll be asking for
    
      var fieldToLgKey = {}; //Maps a ref field name to correpsonding LabelGroup key
    
      //first, determine all the reference fields and build a list of corresponding LabelGroup keys.
      _.forEach(boMetaData.type_descriptor, function(td, fieldName) {
        if(td.type === 'reference') {
          var myKey = keyPrefix+td.ref_class;
          queryKeyList.push(myKey);
          fieldToLgKey[fieldName] = myKey;
        }
      });
    
      //Query for all the necessary LabelGroup's
      return db.LabelGroup.find({key:{$in:queryKeyList}, 'language._id':lang}).then(function(lgList){
        var lgMap = _.indexBy(lgList, 'key');
        var composite;
        var initPromise;
    
        if(lgMap[baseKey]) {
          composite = lgMap[baseKey].value;
          initPromise = Q(true);
        }
        else {
          initPromise = autogenLabelGroup(className).then(function(newLg) {
            composite = newLg.value;
          });
        }
    
        return initPromise.then(function() {
          _.forEach(fieldToLgKey, function(lgKey, fieldName) {
            if(lgMap[lgKey]) {
              var fieldPrefix = fieldName+'.';
              var labelPrefix = ''; //(composite[fieldName] || fieldName)+': ';
    
              _.forEach(lgMap[lgKey].value, function(subLabel, subField) {
                composite[fieldPrefix+subField] = labelPrefix+subLabel;
              });
            }
          });
    
          return composite;
        });
      });
    };
    
    
    return exports;
}