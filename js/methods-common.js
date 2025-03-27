export default {
    accountCheck(a) {
        return new Promise((resolve, e) => {
            fetch("https://hive-api.dlux.io", {
                body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${a}\"]], \"id\":1}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
            })
                .then((r) => {
                    return r.json();
                })
                .then((data) => {
                    if (data.result && data.result.length > 0) {
                        const account = data.result[0];
                        let profilePicUrl = true;
                        try {
                            // Try parsing posting_json_metadata first, then fall back to json_metadata
                            const metadata = JSON.parse(account.posting_json_metadata || account.json_metadata || '{}');
                            if (metadata.profile && metadata.profile.profile_image) {
                                profilePicUrl = metadata.profile.profile_image;
                            }
                        } catch (error) {
                            console.error("Failed to parse metadata:", error);
                        }
                        resolve(profilePicUrl); // Returns URL or false
                    } else {
                        resolve(false); // Account doesn’t exist
                    }
                })
                .catch(m => e(m))
        })
    },
    Base64toNumber(chars) {
        const glyphs =
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
        var result = 0;
        chars = chars.split("");
        for (var e = 0; e < chars.length; e++) {
          result = result * 64 + glyphs.indexOf(chars[e]);
        }
        return result;
      },
    fancyBytes(bytes) {
        var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
        while (bytes > 1024) {
            bytes = bytes / 1024
            counter++
        }
        return `${this.toFixed(bytes, 2)} ${p[counter]}B`
    },
    formatNumber(t, n, r, e) {
        if (typeof t != "number") t = parseFloat(t);
        if (isNaN(t)) return "0";
        if (!isFinite(t)) return (t < 0 ? "-" : "") + "infinite";
        (r = r || "."), (e = e || "");
        var u = t < 0;
        t = Math.abs(t);
        var a = (null != n && 0 <= n ? t.toFixed(n) : t.toString()).split("."),
            i = a[0],
            o = 1 < a.length ? r + a[1] : "";
        if (e)
            for (var c = /(\d+)(\d{3})/; c.test(i);)
                i = i.replace(c, "$1" + e + "$2");
        return (u ? "-" : "") + i + o;
    },
    NumberToBase64(num) {
        const glyphs =
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
        var result = "";
        while (num > 0) {
          result = glyphs[num % 64] + result;
          num = Math.floor(num / 64);
        }
        return result;
      },
    pd(p) { //precision devision
        return parseFloat(1 / Math.pow(10, p)).toFixed(p)
    },
    pf(p) { //precision Factor
        return Math.pow(10, p)
    },
    toFixed(n, digits) {
        return parseFloat(n).toFixed(digits)
      },
};