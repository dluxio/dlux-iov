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
            resolve(false) // Account doesn't exist
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
    if (bytes === 0) return '0 B';
    let counter = 0;
    const units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    while (bytes >= 1024 && counter < units.length - 1) {
      bytes /= 1024;
      counter++;
    }
    // Use toFixed(1) for non-bytes units, toFixed(0) for bytes
    return `${bytes.toFixed(counter > 0 ? 1 : 0)} ${units[counter]}B`;
  },
  fancyRounding(bytes) {
    var counter = 0, p = ['', 'K', 'M', 'B', 'T', 'Q', 'KQ', 'S', 'KS']
    while (bytes > 1000) {
      bytes = bytes / 1000
      counter++
    }
    return `${this.toFixed(bytes, 2)} ${p[counter]}`
  },
  timeUntil(dateString, plusHours = 0, recurrent = false, nowier = false) {
    if (typeof dateString != "string") return "unknown"
    const timezoneRegex = /(Z|[+-]\d{2}:?\d{2})$/;
    if (!timezoneRegex.test(dateString)) {
      // If no timezone is present, append 'Z'
      dateString = dateString + 'Z';
    }
    const targetDate = new Date(dateString)
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
      return 'Now'
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
          if (nowier) return 'Now'
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
  banishPrompt() {
    localStorage.setItem(`hhp:${this.account}`, new Date().getTime());
    this.hasHiddenPrompt = true
    console.log('BANISH')
  },
  voteProposal(num) {
    this.toSign = {
      type: "raw",
      op: [
        [
          "update_proposal_votes",
          {
            voter: this.account,
            proposal_ids: [`${num}`],
            approve: true,
          },
        ],
      ],
      msg: `Supporting Proposal${num}`,
      ops: ["banishPrompt"],
      txid: `Update Proposal Votes`,
    };
    this.hasHiddenPrompt = true;
  },
  hiveClaim() {
    this.toSign = {
      type: "raw",
      op: [[
        "claim_reward_balance",
        {
          "account": this.account,
          "reward_hive": this.accountinfo.reward_hive_balance,
          "reward_hbd": this.accountinfo.reward_hbd_balance,
          "reward_vests": this.accountinfo.reward_vesting_balance
        }
      ]],
      key: "posting",
      id: `Hive Claim ${this.account}`,
      msg: `Claiming...`,
      ops: ["getHiveUser"],
      txid: "reward_claim",
    };

  },
  dropClaim(prefix, claim_id) {
    this.toSign = {
      type: "cja",
      cj: {
        claim: true,
      },
      id: `${prefix}_${claim_id}`,
      msg: `Claiming...`,
      ops: ["getTokenUser"],
      txid: "claim",
    };
  },
  rewardClaim(prefix, rewards_id, gov = false) {
    this.toSign = {
      type: "cja",
      cj: {
        gov,
      },
      id: `${prefix}_${rewards_id}`,
      msg: `Claiming...`,
      ops: ["getTokenUser"],
      txid: "reward_claim",
    };
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
  pow10(precision){
    return Math.pow(10, precision)
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
      id: `Stop Savings Withdrawal` + request_id,
      msg: `Stop Savings Withdrawal` + request_id,
      ops: ["init"],
      txid: `Stop Savings Withdrawal` + request_id,
    };
    this.$emit('tosign', op)
    this.toSign = op
  },
  claimHBD(from) {
    var op = {
      type: "raw",
      op: [
        [
          "transfer_from_savings",
          {
            "from": from,
            "to": from,
            "amount": "0.001 HBD",
            "memo": "Claim HBD interest",
            "request_id": 7249336
          }
        ],
        [
          "cancel_transfer_from_savings",
          {
            "from": from,
            "request_id": 7249336
          }
        ]
      ],
      key: "active",
      id: `Stop Savings Withdrawal 7249336`,
      msg: `Stop Savings Withdrawal 7249336`,
      ops: ["init"],
      txid: `Stop Savings Withdrawal 7249336`,
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
    this.$emit(options.broadcast ? options.broadcast : 'tosign', op)
    this.toSign = op
  },
  sendIt(event) {
    console.log('CV', event)
    this.toSign = event
    this.$emit('tosign', event)
  },
  toFixed(n, digits) {
    return parseFloat(n).toFixed(digits)
  },
  votePowerCalc(accountinfo, vote_weight = 10000, now = false) {
    const hive_price = this.hiveprice.hive.usd
    const dgp = this.hivestats //dynamic global properties
    const effective_VS = parseFloat(accountinfo.vesting_shares) + parseFloat(accountinfo.received_vesting_shares) - parseFloat(accountinfo.delegated_vesting_shares)
    var currentMana = 10000
    if (now) {
      const mana = accountinfo.voting_manabar
      // adjust currentMana as appropriate
    }
    const votingPower = (currentMana / effective_VS) * 10000
    const rshares = effective_VS * (votingPower / 10000) * (vote_weight / 10000)
    const reward_per_rshare = parseFloat(dgp.pending_rewarded_vesting_hive) / parseFloat(dgp.pending_rewarded_vesting_shares)
    const vote_value_hive = rshares * reward_per_rshare
    const vote_value_usd = vote_value_hive * hive_price / 12
    return isNaN(vote_value_usd) ? '0¢' : (vote_value_usd > 1 ? "$" + vote_value_usd.toFixed(2) : (vote_value_usd * 100).toFixed(1) + '¢')
  },
  dailyReturn(accountinfo, vote_weight = 10000, now = false) {
    const hive_price = this.hiveprice.hive.usd
    const dgp = this.hivestats //dynamic global properties
    const effective_VS = parseFloat(accountinfo.vesting_shares) + parseFloat(accountinfo.received_vesting_shares) - parseFloat
      (accountinfo.delegated_vesting_shares)
    var currentMana = 10000
    if (now) {
      const mana = accountinfo.voting_manabar
      // adjust currentMana as appropriate
    }
    const votingPower = (currentMana / effective_VS) * 10000
    const rshares = effective_VS * (votingPower / 10000) * (vote_weight / 10000)
    const reward_per_rshare = parseFloat(dgp.pending_rewarded_vesting_hive) / parseFloat(dgp.pending_rewarded_vesting_shares)
    const vote_value_hive = rshares * reward_per_rshare
    const vote_value_usd = vote_value_hive * hive_price / 2
    return isNaN(vote_value_usd) ? '0¢' : (vote_value_usd > 1 ? "$" + vote_value_usd.toFixed(2) : (vote_value_usd * 100).toFixed(1) + '¢')
  },
  copyText(text) {
    navigator.clipboard.writeText(text)
  },
  blockToTime(block, currentBlock) {
    const now = new Date().getTime()
    // Assumes 3 seconds per block for Hive/SPK
    const then = new Date(now - ((currentBlock - block) * 3000))
    return then.toLocaleDateString() // Simple date format
  },
  AESDecrypt(encryptedMessage, key) {
    // Assumes CryptoJS is loaded globally or imported where this is used
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  },
  toBase58(num) {
    const glyphs = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    while (num > 0) {
      result = glyphs[num % 58] + result;
      num = Math.floor(num / 58);
    }
    return result || "1"; // Return "1" for 0 or invalid input
  },
  numberToBase58(num) {
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    if (num === 0) return base58Chars[0];
    let result = "";
    while (num > 0) {
      result = base58Chars[num % 58] + result;
      num = Math.floor(num / 58);
    }
    return result;
  },
  run(op) {
    console.log('Refreshing:', op)
    if (typeof this[op] == "function" && this.account != "GUEST") {
      this[op](this.account);
    } else if (typeof op == "object") {
      try {
        this[op.op](...op.args)
      } catch (error) {
        console.error('Error signing operation:', error);
        throw error;
      }
    }
  },
  propogate_changes(...args) {
    if (typeof this.signedtx == "object") {
      this.signedtx.push(['propogate_changes', ...args])
    }
  },
  base58ToNumber(b58) {
    const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = 0;
    for (let i = 0; i < b58.length; i++) {
      num = num * 58 + base58Chars.indexOf(b58[i]);
    }
    return num;
  },
  // IPFS Video Loading Support
  // These methods provide HLS.js integration for loading M3U8 playlists and video segments from IPFS
  // Usage: Call initIpfsVideoSupport() in your Vue component's mounted() lifecycle
  // or use the standalone js/ipfs-video-init.js for non-Vue pages
  createIpfsLoader(gatewayUrl = 'https://ipfs.dlux.io') {
    class IpfsLoader {
      constructor(config) {
        this.config = config;
        this.stats = null;
        this.context = null;
        this.callbacks = null;
        this.requestController = null;
        this.gatewayUrl = gatewayUrl;
      }

      load(context, config, callbacks) {
        // HLS.js can pass callbacks as second OR third parameter
        if (typeof config === 'function') {
          callbacks = config;
          config = {};
        }
        
        this.context = context;
        this.callbacks = callbacks;
        
        console.log('IPFS Loader load called with:', {
          context: context,
          callbacks: typeof callbacks,
          hasOnSuccess: !!(callbacks && callbacks.onSuccess),
          hasOnError: !!(callbacks && callbacks.onError)
        });
        this.stats = {
          loading: { start: performance.now(), first: 0, end: 0 },
          parsing: { start: 0, end: 0 },
          buffering: { start: 0, first: 0, end: 0 }
        };

        const url = context.url;
        console.log('IPFS Loader loading:', url);

        let ipfsUrl = url;
        
        // Handle blob URLs for preview mode
        if (url.startsWith('blob:')) {
          console.log('IPFS Loader handling blob URL for preview:', url);
          ipfsUrl = url; // Use blob URL directly
        } else if (url.startsWith(`${this.gatewayUrl}/ipfs/`)) {
          const cid = url.split('/ipfs/')[1].split('?')[0];
          let filename = 'file';

          if (context.type === 'manifest' || context.type === 'level' || url.includes('.m3u8')) {
            filename = 'playlist.m3u8';
          } else if (context.type === 'segment' || context.responseType === 'arraybuffer' || context.frag) {
            filename = 'segment.ts';
          }

          ipfsUrl = `${this.gatewayUrl}/ipfs/${cid}?filename=${filename}`;
        }

        console.log('IPFS Loader fetching:', ipfsUrl);

        this.requestController = new AbortController();
        const headers = {};
        if (context.type === 'manifest' || context.type === 'level') {
          headers['Accept'] = 'application/x-mpegURL';
        } else if (context.type === 'segment') {
          headers['Accept'] = 'video/MP2T';
        }

        fetch(ipfsUrl, { signal: this.requestController.signal, headers })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (context.type === 'manifest' || context.type === 'level') {
              if (!contentType.includes('application/x-mpegURL') && 
                  !contentType.includes('audio/x-mpegurl') && 
                  !contentType.includes('text/')) {
                console.warn('Unexpected content type for playlist:', contentType);
              }
            } else if (context.type === 'segment') {
              if (!contentType.includes('video/MP2T') && !contentType.includes('application/octet-stream')) {
                console.warn('Unexpected content type for segment:', contentType);
              }
            }

            this.stats.loading.first = Math.max(performance.now(), this.stats.loading.start);
            this.stats.parsing.start = this.stats.loading.first;

            return (context.type === 'manifest' || context.type === 'level' || url.includes('.m3u8'))
              ? response.text()
              : response.arrayBuffer();
          })
          .then(data => {
            this.stats.loading.end = Math.max(this.stats.loading.first, performance.now());
            this.stats.parsing.end = this.stats.loading.end;

            console.log('IPFS Loader data received:', typeof data, 'Context:', context.type);
            
            // HLS.js expects the response to match the original URL format
            const response = { 
              url: context.url,  // Use original URL, not gateway URL
              data: data 
            };
            
            if (callbacks) {
              if (typeof callbacks.onSuccess === 'function') {
                console.log('✅ Calling HLS.js onSuccess callback');
                callbacks.onSuccess(response, this.stats, context);
              } else if (typeof callbacks === 'function') {
                // Some HLS.js versions might pass callback directly
                console.log('✅ Calling HLS.js callback directly');
                callbacks(null, response, this.stats, context);
              } else {
                console.warn('❌ No valid onSuccess callback found. Callbacks:', Object.keys(callbacks || {}));
              }
            } else {
              console.warn('❌ No callbacks object provided at all');
            }
          })
          .catch(err => {
            if (err.name === 'AbortError') return;
            console.error('IPFS Loader error:', err, 'URL:', ipfsUrl);
            if (callbacks) {
              const error = { code: err.code || 'NETWORK_ERROR', text: err.message || 'Failed to load IPFS content' };
              if (typeof callbacks.onError === 'function') {
                callbacks.onError(error, context);
              } else if (typeof callbacks === 'function') {
                // Some HLS.js versions might pass callback directly - error as first param
                callbacks(error, null, this.stats, context);
              } else {
                console.warn('❌ No valid onError callback found');
              }
            }
          });
      }

      abort() {
        if (this.requestController) {
          this.requestController.abort();
          this.requestController = null;
        }
      }

      destroy() {
        this.abort();
        this.stats = null;
        this.context = null;
        this.callbacks = null;
      }
    }

    return IpfsLoader;
  },

    setupHLSPlayer(videoElement, gatewayUrl = 'https://ipfs.dlux.io') {
    if (!videoElement || !videoElement.src) return;

    const videoSrc = videoElement.src;
    const videoType = videoElement.type;
    console.log('Setting up player for video:', videoSrc, 'Type:', videoType);

    // Handle blob URLs for preview (they contain M3U8 playlists)
    if (videoSrc.startsWith('blob:')) {
      console.log('Processing blob URL for HLS preview:', videoSrc);
      // Allow blob URLs to be processed by HLS if they're M3U8 playlists
      // Don't skip them - they might be transcoded preview playlists
    }

    // Skip if HLS instance already exists for this element
    if (videoElement.hlsInstance) {
      console.log('HLS instance already exists for this video element');
      return;
    }

    // Skip if already processed (mark with a flag)
    if (videoElement.dataset.hlsProcessed) {
      console.log('Video element already processed for HLS');
      return;
    }

    // Check if this is an M3U8 playlist by URL extension or explicit type
    const isM3U8 = videoType === 'application/x-mpegURL' || 
                   videoType === 'audio/x-mpegurl' ||
                   videoSrc.endsWith('.m3u8') ||
                   videoSrc.includes('.m3u8?') ||
                   videoSrc.includes('filename=') && videoSrc.includes('.m3u8');

    if (isM3U8) {
      if (typeof Hls === 'undefined') {
        console.warn('HLS.js library not loaded');
        return;
      }
  
      if (!Hls.isSupported()) {
        console.log('HLS.js not supported, using native playback');
        return;
      }
  
            if (videoElement.hlsInstance) {
        videoElement.hlsInstance.destroy();
      }

      // Mark as processed to prevent duplicate setup
      videoElement.dataset.hlsProcessed = 'true';

      const IpfsLoader = this.createIpfsLoader(gatewayUrl);
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        loader: IpfsLoader
      });

            videoElement.hlsInstance = hls;
      
      console.log('HLS.js: Loading source:', videoSrc);
      hls.loadSource(videoSrc);
      
      console.log('HLS.js: Attaching media to video element');
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed successfully');
      });

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log('📡 HLS manifest loading started');
      });

      hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
        console.log('📥 HLS manifest loaded:', data);
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('📦 HLS level loaded:', data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS error:', data);
        if (data.fatal) {
          console.error('💀 Fatal HLS error:', data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Attempting to recover from network error');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Attempting to recover from media error');
              hls.recoverMediaError();
              break;
            default:
              console.log('💥 Destroying HLS instance due to unrecoverable error');
              hls.destroy();
              videoElement.dataset.hlsProcessed = 'false';
              break;
          }
        }
      });
    } else {
      console.log('Not an M3U8 playlist, using native video playback');
      // Mark as processed to prevent repeated checks
      videoElement.dataset.hlsProcessed = 'true';
    }
  },

  observeVideoElements(gatewayUrl = 'https://ipfs.dlux.io') {
    // Keep track of processed videos to prevent duplicates
    const processedVideos = new WeakSet();
    
    const processVideo = (video) => {
      if (processedVideos.has(video)) {
        return; // Already processed this exact video element
      }
      processedVideos.add(video);
      
      // Set proper type attribute for M3U8 videos before processing
      if (video.src && !video.type) {
        const isM3U8 = video.src.endsWith('.m3u8') || 
                       video.src.includes('.m3u8?') ||
                       (video.src.includes('filename=') && video.src.includes('.m3u8')) ||
                       video.src.startsWith('blob:'); // Assume blob URLs are M3U8 for preview
        if (isM3U8) {
          video.type = 'application/x-mpegURL';
        }
      }
      
      setTimeout(() => this.setupHLSPlayer(video, gatewayUrl), 10);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'VIDEO') {
              processVideo(node);
            }
            const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
            videos.forEach(video => processVideo(video));
          }
        });

        if (mutation.type === 'attributes' &&
            mutation.target.tagName === 'VIDEO' &&
            mutation.attributeName === 'src') {
          processVideo(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });

    // Setup existing video elements
    document.querySelectorAll('video').forEach(video => processVideo(video));

    return observer;
  },

  initIpfsVideoSupport(gatewayUrl = 'https://ipfs.dlux.io') {
    // Initialize IPFS video support for the current page
    if (typeof Hls === 'undefined') {
      console.warn('HLS.js library not loaded. Please include: <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>');
      return null;
    }

    // Prevent multiple observers on the same page
    if (window._dluxVideoObserver) {
      console.log('Video observer already exists, skipping initialization');
      return window._dluxVideoObserver;
    }

    // Start observing for video elements
    const observer = this.observeVideoElements(gatewayUrl);
    window._dluxVideoObserver = observer;
    return observer;
  },

  // Collaboration utilities
  createCollaborationYDoc() {
    // Use the global Y.js instance to prevent conflicts
    if (window.CollaborationBundle && window.CollaborationBundle.createDocument) {
      return window.CollaborationBundle.createDocument();
    } else if (window.Y && window.Y.Doc) {
      return new window.Y.Doc();
    } else {
      console.error('Y.js not available for collaboration');
      return null;
    }
  },

  getCollaborationProvider() {
    // Return the HocuspocusProvider from the global scope
    return (window.CollaborationBundle && window.CollaborationBundle.HocuspocusProvider) 
      || window.HocuspocusProvider;
  },

  validateCollaborationSetup() {
    // Check if all required collaboration dependencies are available
    const hasYjs = !!(window.CollaborationBundle?.Y || window.Y);
    const hasProvider = !!(window.CollaborationBundle?.HocuspocusProvider || window.HocuspocusProvider);
    const hasBundle = !!window.CollaborationBundle;
    
    return {
      hasYjs,
      hasProvider,
      hasBundle,
      isReady: hasYjs && hasProvider
    };
  }
};