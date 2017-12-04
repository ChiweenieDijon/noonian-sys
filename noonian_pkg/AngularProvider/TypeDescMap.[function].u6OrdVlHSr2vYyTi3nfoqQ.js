function () {
    var db;
    
    /**
     * Constructor for type descriptor maps: special dynamic versions of BO definitions
     * @constructor
     * @param {!Object.<string, Object>} fieldToTd A plain object version of the typeDesc map
     **/
    var TypeDescMap = function(fieldToTd) {
        if(!this || !(this instanceof TypeDescMap)) {
            return new TypeDescMap(fieldToTd);
        }
        
        _.assign(this, fieldToTd);
        
        //Recursively Object-ify type_desc_map's stashed in any composite td's
        for(var fieldName in fieldToTd) {
            if(this[fieldName].type_desc_map) {
                this[fieldName].type_desc_map = new TypeDescMap(this[fieldName].type_desc_map);
            }
            else if(this[fieldName] instanceof Array && this[fieldName].length > 0 && this[fieldName][0].type_desc_map) {
                this[fieldName][0].type_desc_map = new TypeDescMap(this[fieldName][0].type_desc_map);
            }
        }
    };
    
    /**
     * @private 
     * getTypeDescriptor may need access to db when traversing into reference fields.  
     * However, simply injecting db as a factory causes a circular depenency.
     */
    TypeDescMap._init = function(dbService) {
        db = dbService;
    };
    
    /**
     * @function TypeDescMap#getTypeDescriptor
     * Retrieves a type descriptor for a particular field/sub-field; recursing into composites and references if needed.
     * @param {string} path can be a simple fieldname or dotted into reference or composite fields, e.g.:
     *     db.SomeBusinessObj._bo_meta_data.getTypeDescriptor('refField.blah');
     **/
    Object.defineProperty(TypeDescMap.prototype, 'getTypeDescriptor', {
        enumerable:false, writable:false,
        value:function(path) {
            var dotPos = path.indexOf('.');
            
            if(dotPos === -1) { //no dot -> just a field name
                return this[path];
            }
            
            var localField = path.substring(0, dotPos);
            var subPath = path.substring(dotPos+1);
    
            var localTd = this[localField];
    
            if(!localTd) {
              console.error('invalid fieldname for td', localField, this);
              return null;
            }
            
            if(localTd instanceof Array && localTd.length > 0) {
                localTd = localTd[0];
            } 
            
            if(localTd.type === 'reference') {
                var RefModel = db[localTd.ref_class];
                if(!RefModel) {
                    console.error('invalid reference class in type descriptor:', localTd);
                    return null;
                }
                
                return RefModel._bo_meta_data.type_desc_map.getTypeDescriptor(subPath);
            }
            else if(localTd.type === 'composite') {
                var subTd = localTd.type_desc_map;
                if(!subTd) {
                    console.error('composite type descriptor missing child type_desc_map', localTd);
                }
                
                return subTd.getTypeDescriptor(subPath);
            }
            else {
              //dotted into a non-reference or a non-existent field:
              console.log('invalid field specifier for this type descriptor', this, subPath);
              return null;
            }
    
          } //end function
      });
      
      
      
    return TypeDescMap;
}