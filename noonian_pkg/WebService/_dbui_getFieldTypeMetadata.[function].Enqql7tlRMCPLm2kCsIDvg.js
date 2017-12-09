function (queryParams, res, db, _, Q) {
    //Build response that maps type name to an 'info' object, providing what client-side needs in order to build a UI form for a specified business object.
    
    var className = queryParams.class_name;
    var fieldtype = queryParams.field_type;
    var viewEdit = queryParams.view_or_edit;
    
    // console.log('getFieldTypeMetadata for %s %s %s', className, fieldtype, viewEdit);
    
    if(className && !db[className]) {
        throw new Error('Invalid class name: '+className);
    }
    
    if(!className && !fieldtype) {
        throw new Error('Missing required parameter(s)');
    }
    
    var applicKey = viewEdit === 'view' ? 'for_viewing' : 'for_editing';
    
    return db.FieldType.find({}, {name:1,get_validator:1,composite_def:1}).lean().then(function(fieldTypeObjects) {
        
        var fieldTypeMap = _.indexBy(fieldTypeObjects, 'name');
    
    
        //build up query for getting applicable FieldTypeUiSpec's
        var queryObj = {$or:[]};
        
        if(className) {
            
            var applicClause;
            
            if(viewEdit === 'view') {
                applicKey = 'for_viewing';
                applicClause = {
                    $or:[
                        {for_viewing:true},
                        {for_viewing_array:true}
                    ]
                };
            }
            else {
                applicKey = 'for_editing';
                applicClause = {
                    $or:[
                        {for_editing:true},
                        {for_editing_array:true}
                    ]
                };
            }
            
            
            
            var types = {};
        
            //Catch 'universally-applicable' editors/viewers:    
            queryObj.$or.push(
                {$and:[{fieldtypes:{$empty:true}}, applicClause]}
            );
            
            var queryObjBuilder = function(typeDescMap) {
                _.forEach(typeDescMap, function(td) {
                    var clause;
                    // console.log(types);
                    if(td instanceof Array) {
                        td = td[0];
                        if(!types['ARR'+td.type]) {
                            types['ARR'+td.type] = true;
                            
                            clause = {
                                'fieldtypes.name':td.type
                            };
                            clause[applicKey+'_array'] = true;
                            queryObj.$or.push(clause);
                        }
                    }
                    
                    if(td.type && !types[td.type]) {
                        types[td.type] = true;
                        
                        clause = {
                            'fieldtypes.name':td.type
                        }
                        clause[applicKey] = true;
                        queryObj.$or.push(clause);
                    }
                    
                    if(td.type === 'composite') {
                        queryObjBuilder(td.type_desc_map);
                    }
                    else if(fieldTypeMap[td.type] && fieldTypeMap[td.type].composite_def) {
                        queryObjBuilder(fieldTypeMap[td.type].composite_def);
                    }
                    
                });
            };
        
        
            //Recursively pull in all fieldtypes of interest
            queryObjBuilder(db[className]._bo_meta_data.type_desc_map);
        }
        else {
            //just a single fieldtype!
            
            var clause = {};
            var bracketPos = fieldtype.indexOf('[]');
            var myApplic = applicKey;
            if(bracketPos > 0) {
                myApplic += '_array';
                fieldtype = fieldtype.substring(0, bracketPos);
            }
            
            clause['fieldtypes.name'] = fieldtype;
            clause[myApplic] = true;
            
            queryObj.$or.push(clause);
            
            //also grab universally-applicable ones:
            //Catch 'universally-applicable' editors/viewers:    
            clause = {};
            clause[myApplic] = true;
            queryObj.$or.push(
                {$and:[{fieldtypes:{$empty:true}}, clause]}
            );
            
        }
        
         
        // console.log('queryObj %j', queryObj);
        return db.FieldTypeUiSpec.find(queryObj).then(function(uiSpecs) {
            var specObjects = [];
            
            var copyFields = ['template', 'link_fn', 'controller_fn', 'key'];
            var fieldTypeIds = [];
            
            _.forEach(uiSpecs, function(uiSpecObj) {
                
                var spec = {fieldtypes:[]};
                specObjects.push(spec);
                
                if(uiSpecObj[applicKey+'_array']) {
                    spec.for_array = true;
                }
                
                _.forEach(copyFields, function(f) {
                    if(uiSpecObj[f] != null) {
                        spec[f] = ''+uiSpecObj[f];
                    }
                });
                
                _.forEach(uiSpecObj.fieldtypes, function(ftRef) {
                    spec.fieldtypes.push(ftRef.name);
                    fieldTypeIds.push(ftRef._id);
                });
            });
            
            return {
                specObjects,
                fieldTypes:fieldTypeMap
            }; 
            
        });
    });
}