function (expressionValue, testValue) {
    return testValue != null && testValue != '' && !(testValue instanceof Array && testValue.length === 0);
}