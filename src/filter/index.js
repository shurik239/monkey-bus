module.exports = {
    string: function(str) {
        if (typeof str !== "string") {
            throw new Error("str should be string");
        }

        var retStr = str.trim();

        if (retStr === '') {
            throw new Error("str is empty");
        }

        return retStr;
    }
};