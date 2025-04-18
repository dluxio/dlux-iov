export default {
    signedtx: {
        handler(newValue, oldValue) {
            for(let i = oldValue.length; i < newValue.length; i++) {
                if(newValue[i].length >= 2 && newValue[i][0] == "propogate_changes" && typeof this[newValue[i][1]] == "function") {
                    this[newValue[i][1]](...newValue[i].slice(2))
                }
            }
        },
        deep: true
    }
}