function (queryParams, db, Q) {
  var className = queryParams.className;
  var pathField = queryParams.pathField;
  var conditions = queryParams.conditions

  if(!className || !pathField) {
    throw new Error("Missing parameters");
  }

  if(conditions) {
    try {
      conditions = JSON.parse(conditions);
    } catch(e) {console.log(e)}
  }
  
  var deferred = Q.defer();

  var pipeline = [];

  if(conditions) {
    pipeline.push({$match:conditions});
  }

  pipeline.push({$group:{_id:'$'+pathField, total:{$sum:1} }});

  db[className].aggregate(pipeline, function(err, paths) {
    if(err) {
      deferred.reject(err);
    }

    var pathSep = db[className]._bo_meta_data.getTypeDescriptor(pathField).seperator || '/';

    var prefixMap = {};

    for(var i=0; i < paths.length; i++) {
      var currPath = paths[i]._id;
      var currCount = paths[i].total;

      //Compute all the prefixes for currPath; track count:
      var sepIndex = -1;
      var prefix;
      var prefixStack = []; //[top, top.sub1, top.sub1.sub2, ...]

      do {
        sepIndex = currPath.indexOf(pathSep, sepIndex+1);
        if(sepIndex < 0)
          prefix = currPath
        else
          prefix = currPath.substring(0, sepIndex);

        prefixStack.push(prefix);

        if(!prefixMap[prefix])
          prefixMap[prefix] = {count:0};

        prefixMap[prefix].count += currCount;


      } while (sepIndex > -1);


      //Make each prefix know about it's direct children:
      for(var j=0; j < prefixStack.length-1; j++) {
        var currPrefix = prefixStack[j];
        if(!prefixMap[currPrefix].children) {
          prefixMap[currPrefix].children = {};
        }
        prefixMap[currPrefix].children[prefixStack[j+1]] = true;
      }


    }

    //Tidy up the children
    for(var p in prefixMap) {
      if(prefixMap[p].children) {
        prefixMap[p].children = Object.keys(prefixMap[p].children);
        prefixMap[p].children.sort();
      }
    }

    deferred.resolve({result:prefixMap});
  });

    return deferred.promise;
}