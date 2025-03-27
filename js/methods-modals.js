export default {
    apiSelector(t) {
        if (this.tokenprotocol.token == "HIVE" || this.tokenprotocol.token == "HBD") this.api = "NA"
        if (t >= nodes.length) {
            this.api = null
            console.warn("No suitable API node found.")
            return
        }

        if (this.api) return;
        const nodes = Object.keys(this.tokenprotocol.consensus)
        if (!this.api && t < nodes.length) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 1000)
            fetch(this.tokenprotocol.consensus[nodes[t]].api, { signal: controller.signal })
                .then(res => {
                    clearTimeout(timeoutId)
                    if (!res.ok) throw new Error("Network response not OK")
                    return res.json()
                })
                .then(r => {
                    if (typeof r.behind === "number" && r.behind < 5) {
                        this.api = this.tokenprotocol.consensus[nodes[t]].api
                    } else {
                        this.apiSelector(t + 1)
                    }
                })
                .catch(e => {
                    clearTimeout(timeoutId)
                    console.error(`Node ${nodes[t]} failed:`, e.message)
                    this.apiSelector(t + 1)
                })
        }

    },
    getInputType(type) {
        switch (type) {
            case 'I': return 'number';
            case 'S': return 'text';
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