function () {
    var db;
    
    /**
     * Constructor for type descriptor maps: special dynamic versions of BO definitions
     * @constructor
     * @param typeDescMap
     * @param {!Object.<string, Object>} fieldLabels
     **/
    var BusinessObjectLabelGroup = function(typeDescMap, fieldLabels) {
        if(!this || !(this instanceof BusinessObjectLabelGroup)) {
            return new BusinessObjectLabelGroup(typeDescMap, fieldLabels);
        }
        this.__typeDescMap = typeDescMap;
        _.assign(this, fieldLabels);
        
        var myLabels = this;
        
        //Process any composites; recursively instantiate BOLabelGroups as appropriate
        _.forEach(typeDescMap, function(td, fieldName) {
            if(td.type === 'composite' || (td instanceof Array && td[0].type === 'composite')) {
                var myTd = td instanceof Array ? td[0] : td;
                var subLabelgroupKey = '#'+fieldName;
                if(myTd.type_desc_map &&  myLabels[subLabelgroupKey]) {
                    myLabels[subLabelgroupKey] = new BusinessObjectLabelGroup(myTd.type_desc_map, myLabels[subLabelgroupKey]);
                }
            }
        });
    };
    
    /**
     * @private 
     * getTypeDescriptor may need access to db when traversing into reference fields.  
     * However, simply injecting db as a factory causes a circular depenency.
     */
    BusinessObjectLabelGroup._init = function(dbService) {
        db = dbService;
    };
    
    /**
     * @function BusinessObjectLabelGroup#getLabel
     * Retrieves a label for a particular field/sub-field; recursing into composites and references if needed.
     * @param {string} path can be a simple fieldname or dotted into reference or composite fields, e.g.:
     *     db.SomeBusinessObj._bo_meta_data.field_labels.getTypeDescriptor('refField.blah');
     **/
    Object.defineProperty(BusinessObjectLabelGroup.prototype, 'getLabel', {
        enumerable:false, writable:false,
        value:function(path, abbreviated) {
            var dotPos = path.indexOf('.');
            
            if(dotPos === -1) { //no dot -> just a field name
                if(abbreviated && this._abbreviated && this._abbreviated[path]) {
                    return this._abbreviated[path];
                }
                return this[path] || path;
            }
            
            //Peel off the first piece.
            var localField = path.substring(0, dotPos);
            var subPath = path.substring(dotPos+1);
            
            var localTd = this.__typeDescMap[localField];
    
            if(!localTd) {
              console.error('invalid fieldname for td', localField, this);
              return path;
            }
            
            if(localTd instanceof Array && localTd.length > 0) {
                localTd = localTd[0];
            } 
            
            if(localTd.type === 'reference') {
                //Grab label it from referenced db model
                var RefModel = db[localTd.ref_class];
                if(!RefModel) {
                    console.error('invalid reference class in type descriptor:', this);
                    return path;
                }
                
                return RefModel._bo_meta_data.field_labels.getLabel(subPath, abbreviated);
            }
            else if(localTd.type === 'composite') {
                var subLabelgroupKey = '#'+localField;
                
                if(!this[subLabelgroupKey]) {
                    console.error('labelgroup missing for composite field', this);
                    return path;
                }
                
                return this[subLabelgroupKey].getLabel(subPath, abbreviated);
            }
            else {
              //dotted into a non-reference/composite or a non-existent field:
              console.log('invalid field specifier for this label group', this, subPath);
              return path;
            }
    
          } //end function
      });
      
      
      
    return BusinessObjectLabelGroup;
}