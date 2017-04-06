function (res) {
    res.type('css');
    var content;
    if(this.preprocessor !== 'css' && this.compiled_content) {
        content = this.compiled_content;
    }
    else {
        content = this.content;
    }
    return res.send(content);
}