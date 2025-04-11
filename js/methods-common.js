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
  apiSelector(a, t = 0) {
    if (this.tokenprotocol.token == "HIVE" || this.tokenprotocol.token == "HBD") this.api = "NA"
    const nodes = Object.keys(this.tokenprotocol.consensus)
    if (t >= nodes.length) {
      this.api = null
      console.warn("No suitable API node found.")
      return
    }

    if (this[a]) return;
    if (!this.api && t < nodes.length) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 100)
      fetch(this.tokenprotocol.consensus[nodes[t]].api, { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId)
          if (!res.ok) throw new Error("Network response not OK")
          return res.json()
        })
        .then(r => {
          if (typeof r.behind === "number" && r.behind < 5) {
            this[a] = this.tokenprotocol.consensus[nodes[t]].api
          } else {
            this.apiSelector(a, t + 1)
          }
        })
        .catch(e => {
          clearTimeout(timeoutId)
          console.warn(`Node ${nodes[t]} failed:`, e.message)
          this.apiSelector(a, t + 1)
        })
    }

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
  debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },
  fallBackIMG(event, string) {
    event.target.src = 'https://images.hive.blog/u/' + string + '/avatar'
  },
  fancyBytes(bytes) {
    var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    while (bytes > 1024) {
      bytes = bytes / 1024
      counter++
    }
    return `${this.toFixed(bytes, 2)} ${p[counter]}B`
  },
  fancyRounding(bytes) {
    var counter = 0, p = ['', 'K', 'M', 'B', 'T', 'Q', 'E', 'Z', 'Y']
    while (bytes > 1000) {
      bytes = bytes / 1000
      counter++
    }
    return `${this.toFixed(bytes, 2)} ${p[counter]}`
  },
  timeUntil(dateString, plusHours = 0, recurrent = false) {
    const targetDate = new Date(dateString + 'Z')
    const targetMS = targetDate.getTime()
    const now = new Date()
    const nowMS = now.getTime()
    var addTime = (plusHours * 60 * 60 * 1000)
    if (addTime && recurrent) while (targetMS + addTime < nowMS) {
      addTime += (plusHours * 60 * 60 * 1000)
    }
    const diffMs = (targetMS + addTime) - nowMS
    const absDiffSeconds = Math.abs(diffMs) / 1000
    if (absDiffSeconds < 1) {
      return 'now'
    }
    const units = [
      { name: 'year', seconds: 31536000 },  // 36
      { name: 'month', seconds: 2592000 },  // 30 days
      { name: 'day', seconds: 86400 },      // 24 hours
      { name: 'hour', seconds: 3600 },      // 60 minutes
      { name: 'minute', seconds: 60 },      // 60 seconds
      { name: 'second', seconds: 1 }
    ]
    for (const unit of units) {
      if (absDiffSeconds >= unit.seconds) {
        const value = Math.floor(absDiffSeconds / unit.seconds)
        const unitName = value === 1 ? unit.name : unit.name + 's'
        if (diffMs > 0) {
          return `in ${value} ${unitName}`
        } else {
          return `${value} ${unitName} ago`
        }
      }
    }

    // Fallback (shouldn't occur due to seconds unit)
    return 'unknown';
  },
  timeUntilBlocks(diffMs) {
    const absDiffSeconds = Math.abs(diffMs) / 1000
    if (absDiffSeconds < 1) {
      return 'now'
    }
    const units = [
      { name: 'year', seconds: 31536000 },  // 36
      { name: 'month', seconds: 2592000 },  // 30 days
      { name: 'day', seconds: 86400 },      // 24 hours
      { name: 'hour', seconds: 3600 },      // 60 minutes
      { name: 'minute', seconds: 60 },      // 60 seconds
      { name: 'second', seconds: 1 }
    ]
    for (const unit of units) {
      if (absDiffSeconds >= unit.seconds) {
        const value = Math.floor(absDiffSeconds / unit.seconds)
        const unitName = value === 1 ? unit.name : unit.name + 's'
        if (diffMs > 0) {
          return `in ${value} ${unitName}`
        } else {
          return `${value} ${unitName} ago`
        }
      }
    }

    // Fallback (shouldn't occur due to seconds unit)
    return 'unknown';
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
  hiveApiCall(method, params, api) {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1
    });
    return fetch(api ? api : this.hapi, {
      body: body,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error(`Error in ${method}:`, data.error);
          throw new Error(data.error.message);
        }
        return data.result; // Resolve with the result
      })
      .catch(error => {
        console.error(`Error in ${method}:`, error);
        throw error; // Propagate the error
      });
  },
  isoToUnix(isoString) {
    return Math.floor(new Date(isoString).getTime() / 1000);
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
  parseF(n) {
    return parseFloat(n)
  },
  pd(p) { //precision devision
    return parseFloat(1 / Math.pow(10, p)).toFixed(p)
  },
  pf(p) { //precision Factor
    return Math.pow(10, p)
  },
  precision(num, precision) {
    return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
  },
  sigFig(num, sig) {
    // return a number in K or M or B format
    var post = typeof num.split == "function" ? num.split(" ")[1] : "";
    num = parseFloat(num);
    var out;
    if (num < 1) {
      out = (num * 1000).toFixed(sig);
      post = "m" + post;
    } else if (num < 1000) {
      out = num.toFixed(sig);
    } else if (num < 1000000) {
      out = (num / 1000).toFixed(sig);
      post = "K" + post;
    } else if (num < 1000000000) {
      out = (num / 1000000).toFixed(sig);
      post = "M" + post;
    } else if (num < 1000000000000) {
      out = (num / 1000000000).toFixed(sig);
      post = "B" + post;
    } else if (num < 1000000000000000) {
      out = (num / 1000000000000).toFixed(sig);
      post = "T" + post;
    } else if (num < 1000000000000000000) {
      out = (num / 1000000000000000).toFixed(sig);
      post = "Q" + post;
    }
    //remove trailing zeros
    out = out.replace(/\.?0+$/, "");
    return out + post;
  },
  stopRC(from, to) {
    var op = {
      id: "rc"
    }
    op.type = 'cj'
    op.cj = ["delegate_rc", { "from": from, "delegatees": [to], "max_rc": 0 }]
    op.msg = "Removing RC delegation to @" + to
    op.ops = ["fetchDelegationsData"];
    op.txid = 'rc_del_' + to
    this.$emit('tosign', op)
    this.toSign = op
  },
  stopHP(from, to) {
    var op = {
      type: "raw",
      op: [
        [
          "delegate_vesting_shares",
          {
            "delegator": from,
            "delegatee": to,
            "vesting_shares": "0.000000 VESTS"
          }
        ]
      ],
      key: "active",
      id: `Remove delegation to ${to}`,
      msg: `Remove delegation to ${to}`,
      ops: ["fetchDelegationsData"],
      txid: `Remove delegation to ${to}`
    };
    this.$emit('tosign', op)
    this.toSign = op
  },
  stopPD(from) {
    var op = {
      type: "raw",
      op: [
        [
          "withdraw_vesting",
          {
            "account": from,
            "vesting_shares": "0.000000 VESTS"
          }
        ]
      ],
      key: "active",
      id: `Stop Down Power`,
      msg: `Stop Down Power`,
      ops: ["init"],
      txid: `Stop Down Power`
    };
    this.$emit('tosign', op)
    this.toSign = op
  },
  stopRT(from, to, type = "HIVE") {
    var op = {
      type: "raw",
      op: [
        [
          "recurrent_transfer",
          {
            "from": from,
            "to": to,
            "amount": "0.000 " + type,
            "executions": 2,
            "recurrence": 2,
            "memo": ""
          }
        ]
      ],
      key: "active",
      id: `Stop Recurring Transfer to ` + to,
      msg: `Stop Recurring Transfer to ` + to,
      ops: ["init"],
      txid: `Stop Recurring Transfer to ` + to
    };
    this.$emit('tosign', op)
    this.toSign = op
  },
  stopSW(from, request_id) {
    var op = {
      type: "raw",
      op: [
        [
          "cancel_transfer_from_savings",
          {
            from,
            request_id
          }
        ]
      ],
      key: "active",
      id: `Stop Savings Withdrawl` + request_id,
      msg: `Stop Savings Withdrawl` + request_id,
      ops: ["init"],
      txid: `Stop Savings Withdrawl` + request_id,
    };
    this.$emit('tosign', op)
    this.toSign = op
  },
  simpleCJ(id, params, options) {
    console.log('SCJ', id)
    var op = {
      id
    }
    op.type = options.key === "posting" ? 'cj' : 'cja';
    op.cj = {}
    const pairs = params.split(',')
    for (var i = 0; i < pairs.length; i++) {
      op.cj[pairs[i].split(':')[0]] = pairs[i].split(':')[1]
    }
    op.msg = options.msg
    op.ops = options.ops || [];
    op.api = options.api || "";
    op.txid = id + '_' + Date.now();
    console.log(op)
    this.$emit(options.broadcast ? options.broadcast : 'modalsign', op)
    this.toSign = op
  },
  toFixed(n, digits) {
    return parseFloat(n).toFixed(digits)
  },
};