function (TypeDescMap,BusinessObjectLabelGroup) {
    
    var BusinessObjectModelFactory = {};
    
    
    /**
     * Factory for building a business object model
     * @param definition
     * @param name 
     * @param fieldLabels
     * @param id
     * @param superModel
     * @param instanceFunctions
     * @param modelFunctions
     */
    BusinessObjectModelFactory.getConstructor = function(definition, name, fieldLabels, id, superModel, instanceFunctions, modelFunctions) {
        
        
        /**
         * BusinessObjectModel constructor
         * This is what will ultimately accessed via the db.XyzBusinessObject API.
         * @constructor
         */
        var BusinessObjectModel = function(initObj) {
            if(!this || !(this instanceof BusinessObjectModel)) {
                return new BusinessObjectModel(initObj);
            }
            this.initialize(initObj);
        };
        
        //Separate out initialize function to allow constructing a stub that is 
        // populated asynchronously on response from web service
        Object.defineProperty(BusinessObjectModel.prototype, 'initialize', {
            enumerable:false,writable:false,
            value:function(initObj) {
                var THIS = this;
                if(initObj) {
                  this._id = initObj._id;
                  this.__ver = initObj.__ver;
                  this.__t = initObj.__t;
                  
                  _.forEach(this._bo_meta_data.type_desc_map, function(td, fieldName) {
                    if(td.construct) {
                      THIS[fieldName] = td.construct(initObj[fieldName]);
                    }
                    else if(initObj.hasOwnProperty(fieldName)) {
                      THIS[fieldName] = initObj[fieldName];
                    }
                  });
                }
            }
        });
        
        
        
        //Create the _bo_meta_data object
        var boMetaData = {
            type_desc_map: new TypeDescMap(definition)
        };
        
        id && (boMetaData.bod_id = id);
        name && (boMetaData.class_name = name);
        fieldLabels && (boMetaData.field_labels = new BusinessObjectLabelGroup(boMetaData.type_desc_map, fieldLabels));
        
        //Merge in superclass type descriptors
        if(superModel) {
            _.merge(boMetaData.type_desc_map, superModel._bo_meta_data.type_desc_map);
        }
        
        
        var propertyConfig = { enumerable:false, writable:false, value:boMetaData };
        Object.defineProperty(BusinessObjectModel, '_bo_meta_data', propertyConfig);
        Object.defineProperty(BusinessObjectModel.prototype, '_bo_meta_data', propertyConfig);
        
        
        //Assign the "static" member functions to the constructor
        if(modelFunctions) {
            _.forEach(modelFunctions, function(fn, propertyName) {
                Object.defineProperty(BusinessObjectModel, propertyName, {
                    enumerable:false, writable:false,
                    value: fn
                });
            });
        }
        
        //Assign "instance" member functions to the prototype
        if(instanceFunctions) {
            _.forEach(instanceFunctions, function(fn, propertyName) {
                Object.defineProperty(BusinessObjectModel.prototype, propertyName, {
                    enumerable:false, writable:false,
                    value: fn
                });
            });
        }
        
        
        //Wire up _disp getter
        if(definition._disp) {
            try {
                BusinessObjectModel.prototype._disp_template = _.template(definition._disp);
            }
            catch(err) {
                console.error('ERROR COMPILING _disp TEMPLATE for '+name, definition._disp, err);
            }
        }
        
        Object.defineProperty(BusinessObjectModel.prototype, '_disp', {
            get: function() {
                var td = this._bo_meta_data.type_desc_map || {};
                
                if(this._disp_template) {
                    try {
                        return this._disp_template(this);
                    }
                    catch(err) {}
                }
                else if(td.name) {
                    if(this.name) return ''+this.name;
                }
                else if(td.key) {
                    if(this.key) return ''+this.key;
                }
                else if(td.title) {
                    if(this.title) return ''+this.title;
                }
                
                return this._bo_meta_data.class_name+'['+this._id+']';
            }
        });
        
        
        //Process composite field types as special subtypes.  To set a composite field value, you must instantiate a special "sub-model"
        _.forEach(boMetaData.type_desc_map, function(td, fieldName) {
            if(td.type === 'composite' || (td instanceof Array && td[0].type === 'composite') ) {
                
                var myTd = td instanceof Array ? td[0] : td;
                
                //Define "sub-model" constructor to allow for creation of objects that can be assigned to this field
                BusinessObjectModel[fieldName] = BusinessObjectModelFactory.getConstructor(
                        myTd.type_desc_map,
                        name+'#'+fieldName, 
                        fieldLabels ? fieldLabels['#'+fieldName] : null
                );
                
                //TODO: deprecate these construct() functions somehow... 
                //Make constructor accessible via the type descriptor
                Object.defineProperty(myTd, 'construct', {
                    enumerable:false, writable:false, value:BusinessObjectModel[fieldName]
                });
                
    
                if(td instanceof Array) {
                    Object.defineProperty(td, 'construct', {
                        enumerable:false, writable:false,
                        value:function(initArr) {
                            var thisTd = this[0];
                            var ret = [];
                            _.forEach(initArr, function(initObj) {
                                ret.push(thisTd.construct(initObj));
                            });
                            
                            return ret;
                        }
                    });
                }
            }
        });//end type_desc_map iteration
        
        Object.freeze(BusinessObjectModel);
        
        
        return BusinessObjectModel;
    }; //end getConstructor definition
    
    
      
      
    return BusinessObjectModelFactory;
}