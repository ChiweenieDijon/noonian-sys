function (outStream, nodeRequire) {
    //If outStream is an http response, set content-type appropriately
    if(typeof outStream.type === 'function') {
        outStream.type('application/json');
    }
    outStream.write(JSON.stringify(this.content));
    return outStream.end();
}