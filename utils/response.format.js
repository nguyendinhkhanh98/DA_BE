module.exports = class ResponseFormat {
    /**
     * Re-structure data response to client
     * 
     * @param {Number} code HTTP code
     * @param {Boolean} success State success
     * @param {Object} data Data response for client
     * @param {String} message Message if error trigger
     */
    constructor(code, success, data, message) {
        this.code = code;
        this.success = success;
        this.data = data;
        this.message = message;
    }

    /**
     * Resizable object
     */
    toObject() {
        return { code: this.code, success: this.success, data: this.data, message: this.message };
    }
}