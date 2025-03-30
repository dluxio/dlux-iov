export default {
    getInputType(type) {
        switch (type) {
            case 'I': return 'number';
            case 'S': return 'text';
            case 'O': return 'select';
            default: return 'text';
        }
    },
    validateField(key) {
        const field = this.feat.json[key];
        if (field.check === 'AC') {
            this.accountCheck(this.form[key]).then(result => {
                if (result) {
                    this.validations[key] = true;
                    this.feat[key].profilePicUrl = result === true ? null : result; // Store URL for UI
                } else {
                    this.validations[key] = false;
                    this.feat[key].profilePicUrl = null;
                }
            }).catch(() => {
                this.validations[key] = false;
                this.feat[key].profilePicUrl = null;
            });
        }
    },
};