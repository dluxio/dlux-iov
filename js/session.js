let HP

// function validateResponse(response) {
//     if (!response.ok) {
//         throw Error(response.statusText);
//     }
//     return response;
// }

// function updateprogress(id) {
//     User[`id-iterator-${id}`]++
//         document.getElementById(`progressbar${id}`).style.width = `${parseInt(User[`id-iterator-${id}`]*5)}%`
//         document.getElementById(`progressbarlabel${id}`).innerText = `${User[`id-iterator-${id}`]} Confirmations. 20 Required`
//         if(User[`id-iterator-${id}`] >= 21 ){
//             delete User[`id-iterator-${id}`]
//             if (window.location.pathname.split('/')[1] == 'me'){
//                 pageSpecfic(User)
//             } else {
//                 pageSpecfic(window.location.pathname.split('/')[0].split('@')[1])
//             }
//         } else {
//             setTimeout(updateprogress(id), 3000)
//         }
//     }

 function feedback(r, cb) {
     console.log(r)
     cb(r)
 }

//  function picFinder(body, json){
//      if (typeof json.parseJSON().image == 'string'){
//         return json.parseJSON().image
//      } else if (typeof json.parseJSON().image[0] == 'string'){
//         return json.parseJSON().image[0]
//      } else if (typeof json.parseJSON().hash360 == 'string'){
//         return `https://ipfs.dlux.io/ipfs/${json.parseJSON().Hash360}`
//      }else {
//         var looker 
//         try{
//         looker = body.split('![')[1]
//         looker = looker.split('(')[1]
//         looker = looker.split(')')[0]
//         } catch (e){
//             return '/img/dluxdefault.png'
//         }
//         return looker
//      }
//  }

//  function readResponseAsBlob(response) {
//      return response.blob();
//  }
 var user, dlux, User = { dlux: {}, hive: {}, dex: {}, stats: {}, opts: { to: 0, agent: 0, fee: '0.000 HIVE', dfee: 25, type: 'Buy' } }

//  function checkCookie() {
//      console.log('Checking for login')
//      user = localStorage.getItem('user');
//      if(user && getCookie('user') != user){
//          console.log('cookie is not set, refreshing')
//          setCookie('user', user, 30)
//          window.location.reload()
//      }
//      console.log('user=' + user)
//      if (user != null) {
//          let account = localStorage.getItem('account')
//          if (account != 'undefined') {
//              console.log(account)
//              dlux = new Dluxsession({ hiveid: user, account });
//          } else {
//              dlux = new Dluxsession({ hiveidip: user });
//          }
//          //document.getElementById('userImage').src = 'https://images.hive.blog/u/' + user + '/avatar
//          var urls = [`https://token.dlux.io/@${user}`, 'https://token.dlux.io/dex', 'https://token.dlux.io/stats', 'https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd', `https://token.dlux.io/api/pfp/${user}`] //datasources
//          let promises = urls.map(u => fetch(u))
//          promises.push(fetch("https://hive-api.dlux.io", {
//              body: "{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_dynamic_global_properties\", \"params\":[], \"id\":1}",
//              headers: {
//                  "Content-Type": "application/x-www-form-urlencoded"
//              },
//              method: "POST"
//          }))
//          promises.push(fetch("https://hive-api.dlux.io", {
//              body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${user}\"]], \"id\":1}`,
//              headers: {
//                  "Content-Type": "application/x-www-form-urlencoded"
//              },
//              method: "POST"
//          }))
         
//          Promise.all(promises).then(res =>
//              Promise.all(res.map(res => res.json()))
//          ).then(jsons => {
//              User.dlux = jsons[0]
//              User.dex = jsons[1]
//              User.stats = jsons[2].result
//              User.stats.HiveVWMA = jsons[2].hiveVWMA
//              User.stats.HbdVWMA = jsons[2].hbdVWMA
//              User.price = jsons[3].hive.usd
//             //  document.getElementById('userPFP').value = jsons[4].result[0].pfp;
//              //console.log(jsons[4].result[0].pfp)
//              User.hstats = jsons[5].result
//              User.hive = jsons[6].result[0]
//              console.log({User})
//              try { 
//                 if (window.location.pathname.split('/')[1] == 'me' || window.location.pathname.split('/')[1] == 'dex'|| window.location.pathname.split('/')[1] == undefined){
//                     pageSpecfic(User)
//                 } else {
//                     console.log(window.location.pathname.split('/')[1].split('@')[1])
//                     const blogger = window.location.pathname.split('/')[1].split('@')[1]
//                     var urls = [`https://token.dlux.io/@${blogger}`]
//                     let promises = urls.map(u => fetch(u))
//                     promises.push(fetch("https://hive-api.dlux.io", {
//                         body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_accounts\", \"params\":[[\"${blogger}\"]], \"id\":1}`,
//                         headers: {
//                             "Content-Type": "application/x-www-form-urlencoded"
//                         },
//                             method: "POST"
//                         }))
//                     Promise.all(promises).then(res =>
//                         Promise.all(res.map(res => res.json()))
//                         .catch(e=>console.log(e))
//                         ).then(jsons => {
//                             let Blogger = {
//                                 dlux: jsons[0],
//                                 dex: User.dex,
//                                 stats: User.stats,
//                                 price: User.price,
//                                 hstats: User.hstats,
//                                 hive: jsons[1]
//                             }
//                         pageSpecfic(Blogger)
                
//                         }).catch(e=>console.log(e))
//                     }
//               } catch (e) {}
//          })
//      }
//  }

//  function me(usr) {
    // console.log(usr)
    // usr.hbd = { balance: usr.hive.hbd_balance }
    // User.hbd = { balance: usr.hive.hbd_balance }
    // document.getElementById('updateNode').addEventListener("click", function() {
    //     updateNode()
    // })
    // console.log('running check')
    // document.getElementById('escrowtxbutton').addEventListener("click", function() {
    //     document.getElementById('escrowtx').innerHTML = `<hr class="my-2 bg-light">`
    //     let loading = document.createElement('p')
    //     loading.id = 'loadingtx'
    //     loading.innerText = `Retrieving orders.`
    //     document.getElementById('escrowtx').appendChild(loading)
    //     var myVar = setInterval(myTimer, 500);
    //     fetch('https://token.dlux.io/dex')
    //     .then(function(response) {
    //         return response.json();
    //     })
    //     .then(r => {
    //         for (type in r.markets){
    //             for( order in r.markets[type].sellOrders){
    //                 if(user == r.markets[type].sellOrders[order].agent){
    //                     let coll = document.createElement('p')
    //                     coll.innerText = `${parseFloat(r.markets[type].sellOrders[order].amount / 500).toFixed(3).commafy()} held to earn ${parseFloat(r.markets[type].sellOrders[order].amount * 0.000001).toFixed(3).commafy()} upon purchase of ${r.markets[type].sellOrders[order].txid} by ${r.markets[type].sellOrders[order].co}`
    //                     document.getElementById('escrowtx').appendChild(coll)
    //                 }
    //                 if(user == r.markets[type].sellOrders[order].tagent){
    //                     let coll = document.createElement('p')
    //                     coll.innerText = `${parseFloat(r.markets[type].sellOrders[order].amount / 500).toFixed(3).commafy()} held to earn ${parseFloat(r.markets[type].sellOrders[order].amount * 0.000001).toFixed(3).commafy()} upon purchase of ${r.markets[type].sellOrders[order].txid} by ${r.markets[type].sellOrders[order].co}`
    //                     document.getElementById('escrowtx').appendChild(coll)
    //                 }
    //             }
    //             for( order in r.markets[type].buyOrders){
    //                 if(user == r.markets[type].buyOrders[order].agent){
    //                     let coll = document.createElement('p')
    //                     coll.innerText = `${parseFloat(r.markets[type].buyOrders[order].amount / 500).toFixed(3).commafy()} held to earn ${parseFloat(r.markets[type].buyOrders[order].amount * 0.000001).toFixed(3).commafy()} upon purchase of ${r.markets[type].buyOrders[order].txid} by ${r.markets[type].buyOrders[order].eo}`
    //                     document.getElementById('escrowtx').appendChild(coll)
    //                 }
    //                 if(user == r.markets[type].buyOrders[order].tagent){
    //                     let coll = document.createElement('p')
    //                     coll.innerText = `${parseFloat(r.markets[type].buyOrders[order].amount / 500).toFixed(3).commafy()} held to earn ${parseFloat(r.markets[type].buyOrders[order].amount * 0.000001).toFixed(3).commafy()} upon purchase of ${r.markets[type].buyOrders[order].txid} by ${r.markets[type].buyOrders[order].eo}`
    //                     document.getElementById('escrowtx').appendChild(coll)
    //                 }
    //             }              
    //         }
    //         myStopFunction()
    //         document.getElementById('loadingtx').innerText = `Orders your node is facilitating:`
    //     })

    //     function myTimer() {
    //         document.getElementById("loadingtx").innerText += '.';
    //     }

    //     function myStopFunction() {
    //         clearInterval(myVar);
    //     } 
    //     console.log('Problem code below')
    //     User.dlux.nextVoteWeight = setVotePower(usr.dlux.poweredUp, usr.dlux.up, usr.dlux.down, usr.hive.voting_power, usr.hstats.head_block_number)
    // document.getElementById('buyDluxTitle').innerText = 'Buy With:'
    // document.getElementById('selllink').addEventListener("click", function() {
    //     User.opts.type = 'Sell'
    //     dexmodal("hive", "Sell");
    // })
    // console.log('problem code above')
    // })

    // fetch('https://token.dlux.io/feed')
    //     .then(r => {
    //         return r.json()
    //     })
    //     .then(result => {
    //         let node = document.createElement('h4')
    //         node.innerHTML = 'Transactions:'
    //         node.class = "mb-3"
    //         let txholder = document.getElementById('dluxtxs')

    //         for (i in result.feed) {
    //             if (result.feed[i].match(user) && !result.feed[i].match('Report')) {
    //                 let txnode = document.createElement('div')
    //                 txnode.innerHTML = `
	// 				   <p class="my-2">${i}<br>${result.feed[i]}</p>
	// 				   <hr class="my-3 bg-light">`
    //                 txholder.insertAdjacentElement('afterbegin', txnode)
    //             }
    //         }
    //         txholder.insertAdjacentElement('afterbegin', node)
    //     })
    //     .catch(e => { console.log(e) })

    // fetch('https://token.dlux.io/markets')
    //     .then(r => {
    //         return r.json()
    //     })
    //     .then(result => {
    //         const blogger = window.location.pathname.split('/')[1].split('@')[1]
    //         var node
    //         if (blogger) {
    //             node = result.markets.node[blogger]
    //         } else {
    //             node = result.markets.node[user]
    //             document.getElementById('nodeDomainSet').value = node.domain.split('//')[1]
    //             document.getElementById('nodeBidRateSet').value = parseFloat(node.bidRate / 100).toFixed(1)
    //             document.getElementById('nodeDaoRateSet').value = parseFloat(node.marketingRate / 100).toFixed(1)
    //             document.getElementById('escrowCheckSet').checked = node.escrow
    //             document.getElementById('mirrorCheckSet').checked = node.mirror || false
    //         }
    //         document.getElementById('nodeDomain').value = node.domain.split('//')[1]
    //         document.getElementById('nodeBidRate').value = parseFloat(node.bidRate / 100).toFixed(1)
    //         document.getElementById('nodeDaoRate').value = parseFloat(node.marketingRate / 100).toFixed(1)
    //         document.getElementById('escrowCheck').checked = node.escrow
    //         document.getElementById('mirrorCheck').checked = node.mirror || false
    //     })
    //     .catch(e => { console.log(e) })

//     fetch("https://hive-api.dlux.io", {
//             body: `{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.get_account_history\", \"params\":[\"${user}\", -1, 100], \"id\":1}`,
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded"
//             },
//             method: "POST"
//         })
//         .then(r => { return r.json() })
//         .then(r => {
//             console.log(r)
//             let node = document.createElement('h4')
//             node.innerHTML = 'Transactions:'
//             node.class = "mb-3"
//             let txholder = document.getElementById('hivetxs')
//             console.log(r.result[0][1].op[0])
//             for (i in r.result) {
//                 console.log(r.result[i][1].op[0])
//                 let txnode = document.createElement('div')
//                 txnode.innerHTML = `
//                     <p class="my-2">${r.result[i][1].op[0]}<br>${JSON.stringify(r.result[i][1].op[1])}</p>
//                     <hr class="my-3 bg-light">`
//                 txholder.insertAdjacentElement('beforeend', txnode)
//             }
//             txholder.insertAdjacentElement('afterbegin', node)
//         })
// }

//  function vote(author, permlink, weightid) {
//      return new Promise((resolve, reject) => {
//          var weight = parseInt(document.getElementById(weightid).value) * 100
//          Dluxsession.hive_sign([user, [
//                  ['vote', { voter:user, author, permlink, weight }]], 'posting'])
//              .then(r => {
//                  resolve(r)
//              })
//              .catch(e => { reject(e) })
//      });
//  }

//  function dluxsend(to, amount, memo, prefix = 'dlux_') {
//     var token, statusapi
//     switch (prefix){
//         case 'spkcc_':
//             token = 'LARYNX'
//             statusapi = 'spkinstant.hivehoneycomb.com'
//             break;
//         default:
//             token = 'DLUX'
//             statusapi
//     }
//     return new Promise((resolve, reject) => {
//         amount = parseInt(amount * 1000)
//         if (amount){
//          checkAccount(to)
//              .then(r => {
//                  broadcastCJA({to, amount, memo}, `${prefix}send`, `Trying to send ${token}...`, statusapi)
//              })
//              .catch(e => { alert(e) })
//         } else {
//             alert('Please enter an amount to send.')
//         }
//     });
//  }

//  function reply(parent_author, parent_permlink, titleid, bodyid) {
//      return new Promise((resolve, reject) => {
//          var title = document.getElementById(titleid).value
//          var body = document.getElementById(bodyid).value
//          var author = localStorage.getItem('user')
//          Dluxsession.hive_sign([author, [
//                  ['comment', {
//                      author,
//                      title,
//                      body,
//                      parent_author,
//                      parent_permlink,
//                      permlink: 're_' + parent_permlink,
//                      json_metadata: ""
//                  }]
//              ], 'posting'])
//              .then(r => {
//                  resolve(r)
//              })
//              .catch(e => { reject(e) })
//      });
//  }

//  function setCookie(cname, cvalue, exdays) {
//      var d = new Date();
//      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
//      var expires = "expires=" + d.toUTCString();
//      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
//  }

//  function delete_cookie( name, path, domain ) {
//   if( getCookie( name ) ) {
//     document.cookie = name + "=" +
//       ((path) ? ";path="+path:"")+
//       ((domain)?";domain="+domain:"") +
//       ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
//   }
// }

//  function getCookie(cname) {
//     var name = cname + "=";
//     var decodedCookie = decodeURIComponent(document.cookie);
//     var ca = decodedCookie.split(';');
//     for (var i = 0; i < ca.length; i++) {
//         var c = ca[i];
//         while (c.charAt(0) == ' ') {
//             c = c.substring(1);
//         }
//         if (c.indexOf(name) == 0) {
//             return c.substring(name.length, c.length);
//         }
//     }
//     return "";
// }


// function setAPI (name, api){
//     if(!api){delete_cookie(name);window.location.reload(true);return}
//     if(api.indexOf('https://') == -1)return
//     api = 'https://' + api.split('//')[1].split('/')[0]
//     setCookie(name, api, 365)
//     window.location.reload(true)
// }

//  function logout() {
//     //  localStorage.clear()
//     //  $('.active-session').addClass('d-none');
//     //  $('.no-session').removeClass('d-none');
//     //  user = ''
//     //  User = ''
//  }

//  function loginDismiss() {
//     //  $('.active-session').removeClass('d-none');
//     //  $('.no-session').addClass('d-none');
//     //  $('#loginModal').modal('hide');
//     //  checkCookie();
//  }

//  function showProfileImage(responseAsBlob) {
//      try {
//          var container = document.getElementById('user-name');
//          container.removeChild(container.childNodes[0])
//          var imgElem = document.createElement('img');
//          imgElem.width = "24"
//          imgElem.height = "25"
//          imgElem.class = "img-fluid bg-light rounded-circle"
//          container.appendChild(imgElem);
//          var imgUrl = URL.createObjectURL(responseAsBlob);
//          imgElem.src = imgUrl;
//      } catch (e) { console.log(e) }
//  }

//  function setdata(account) {
//      try {
//          document.getElementById('user-name').innerHTML = document.getElementById('user-name').innerHTML + ' @' + account
//      } catch (e) { console.log(e) }
//  }

 function broadcastCJA(cj, id, msg, api){
    Dluxsession.hive_sign([user, [
                         ['custom_json', {
                             "required_auths": [user],
                             "required_posting_auths": [],
                             "id": id,
                             "json": JSON.stringify(cj)
                         }]
                     ], 'active'])
                     .then(r => {
                         statusWaiter (r, msg, api)
                     })
                     .catch(e => { console.log(e) })
 }

 function broadcastTransfer(cj, msg, api){
     console.log('bT', cj)
    Dluxsession.hive_sign([user, [
                         ['transfer', {
                             to: cj.to,
                             from: user,
                             amount: `${parseFloat((cj.hive ? cj.hive : cj.hbd)/1000).toFixed(3)} ${cj.hive?'HIVE':'HBD'}`,
                             memo: cj.memo
                         }]
                     ], 'active'])
                     .then(r => {
                         statusWaiter (r, msg, api)
                     })
                     .catch(e => { console.log(e) })
 }
// DEX Actions //
//buyFTHive('{{set}}','{{uid}}',{{price}},{{pricenai.token}})
// function buyFTHive(set, uid, price, token, qty){
//     qty = parseInt(document.getElementById(qty).value) || 1
//     console.log(set, uid, price, token)
//     broadcastTransfer({to:'dlux-cc',[`${token.toLowerCase()}`]:price * qty , memo: `NFT ${set}:${uid}`}, `Buying a ${set} mint token`)
// }
// function sellDEX(dlux, hive, hbd, hours, prefix = 'dlux_', callback){
//     var token, statusapi
//     switch (prefix){
//         case 'spkcc_':
//             token = 'LARYNX'
//             statusapi = 'spkinstant.hivehoneycomb.com'
//             break;
//         default:
//             token = 'DLUX'
//     }
//     var andthen = ' at market rate'
//     dlux = parseInt(parseFloat(dlux)*1000)
//     hive = parseInt(parseFloat(hive)*1000)
//     hbd = parseInt(parseFloat(hbd)*1000)
//     hours = parseInt(hours)
//     if (hive || hbd){
//         const price = parseFloat(dlux/(hive? hive : hbd)).toFixed(6)
//         andthen = ` at ${price} ${hive?'HIVE':'HBD'} per ${token}`
//     }
//     if(!hbd) broadcastCJA({ [token.toLocaleLowerCase()]:dlux, hive, hours}, `${prefix}dex_sell`, `Selling ${parseFloat(dlux/1000).toFixed(3)} ${token}${andthen}`, statusapi)
//     else broadcastCJA({ [token.toLocaleLowerCase()]:dlux, hbd, hours}, `${prefix}dex_sell`, `Selling ${parseFloat(dlux/1000).toFixed(3)} ${token}${andthen}`, statusapi)
//  }

//  function buyDEX(hive, hbd, dlux, hours, prefix = 'dlux_', callback){
//      console.log({hive,hbd,dlux})
//     var token, msaccount, statusapi
//     switch (prefix){
//         case 'spkcc_':
//             token = 'LARYNX'
//             msaccount = 'spk-cc'
//             statusapi = 'spkinstant.hivehoneycomb.com'
//             break;
//         default:
//             token = 'DLUX'
//             msaccount = 'dlux-cc'
//     }
//     dlux = parseInt(parseFloat(dlux)*1000)
//     hive = parseInt(parseFloat(hive)*1000)
//     hbd = parseInt(parseFloat(hbd)*1000)
//     var andthen = ' at market rate', rate = undefined, hours = 720
//     if (dlux){
//         rate = parseFloat((hive? hive : hbd)/dlux).toFixed(6)
//         andthen = ` at ${rate} ${hive?'HIVE':'HBD'} per ${token}`
//     }
//     if(!hbd) broadcastTransfer({ to: msaccount, hive, memo:JSON.stringify({rate, hours})}, `Buying ${token} with ${parseFloat((hive||hbd)/1000).toFixed(3)} ${hive?'HIVE':'HBD'} ${andthen}`, statusapi)
//     else broadcastTransfer({ to: msaccount, hbd, memo:JSON.stringify({rate, hours})}, `Buying ${token} with ${parseFloat((hive||hbd)/1000).toFixed(3)} ${hive?'HIVE':'HBD'} ${andthen}`, statusapi)
//  }

//  function cancelDEX(txid, prefix = 'dlux_') {
//      var token, statusapi
//     switch (prefix){
//         case 'spkcc_':
//             token = 'LARYNX'
//             statusapi = 'spkinstant.hivehoneycomb.com'
//             break;
//         default:
//             token = 'DLUX'
//     }
//     var txidstring = txid
//     if (typeof txid === 'array'){
//         txidstring = txid.join(',')
//     }
//     broadcastCJA({ txid}, `${prefix}dex_clear`, `Canceling: ${txidstring}`, statusapi)
// }


// FT Transfers //

// function giveFT(setname, to, qty, callback){
//     checkAccount(to)
//     .then(r => {
//         broadcastCJA({set: setname, to, qty}, "dlux_ft_transfer", `Trying to give ${setname} mint token to ${to}`) 
//     })
//     .catch(e=>alert(`${to} is not a valid hive account`))
//  }

// function tradeFT(setname, to, price, callback){
//     price = parseInt(price * 1000)
//     checkAccount(to)
//     .then(r => {
//         broadcastCJA({ set: setname, to, price}, "dlux_ft_escrow", `Trying to trade ${setname}: Mint Token`)
//     })
//     .catch(e=>alert(`${to} is not a valid hive account`))
//  }
// {
//     hive:1000, //1.000 Hive || hbd: 1000 // 1.000 HBD
//     quantity: 4096, //4096 NFTs
//     set: 'dlux', //set tokens to sell
//     distro: 'account1_5000,acc2_5000' //must add to 10000
// }
// function sellFT(setname, price, type, quantity = 1, distro,  callback){
//     price = parseInt(price * 1000)
//     if(type.toUpperCase() == 'HIVE')type = 'hive'
//     else if (type.toUpperCase() == 'HBD') type = 'hbd'
//     else type = 0
//     if(!type)broadcastCJA({set: setname, price}, 'dlux_ft_sell', `Trying to sell ${setname} mint token`)
//     else broadcastCJA({set: setname, [type]:price, quantity, distro}, 'dlux_fts_sell_h', `Trying to sell ${setname} mint token`)
//  }

//  function auctionFT(setname, price, now, time, callback){
//     time = parseInt(time)
//     price = parseInt(price * 1000)
//     broadcastCJA({set:setname, price, now, time}, 'dlux_ft_auction', `Trying to auction ${setname} mint tokens`)
//  }

// function airdropFT(setname, to_str,  callback){
//     let to_array = to_str.split(' ')
//     to_array = [... new Set(to_array)]
//     var promises = []
//     for (item in to_array){ promises.push(checkAccount(to_array[item]))}
//     Promise.all(promises)
//     .then(r=>{
//         broadcastCJA({set:setname, to: to_array}, 'dlux_ft_airdrop', `Trying to airdrop ${setname} mint tokens`)
//     })
//     .catch(e=>alert(`At least one hive account doesn't exist: ${e}`))
//  }

// FT Actions //

// function openFT(setname, callback){
//     broadcastCJA({set:setname}, 'dlux_nft_mint', `Minting ${setname} token...`)
//  }

// function buyFT(setname, uid, price, type,  callback){
//      price = parseInt(price * 1000)
//      if(type == 'HIVE')broadcastTransfer({ to: 'dlux-cc', hive: bid_amount, memo:`NFTbuy ${setname}:${uid}`}, `Buying on ${setname}:${uid}`)
//      else if(type == 'HBD')broadcastTransfer({ to: 'dlux-cc', hbd: bid_amount, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
//      else broadcastCJA({set: setname, uid, price}, 'dlux_ft_buy', `Trying to buy ${setname} mint token`)
//  }

// function bidFT(setname, uid, callback){
//     var bid_amount = document.getElementById(`${setname}-${uid}-bid`).value
//     bid_amount = parseInt(bid_amount * 1000)
//     broadcastCJA({set: setname, uid, bid_amount}, 'dlux_ft_bid', `Trying to bid on ${setname} mint token.`) 
//  }

// function sellFTcancel(setname, uid, token,  callback){
//      broadcastCJA({set: setname, uid}, token == 'DLUX' ? 'dlux_ft_cancel_sell' : 'dlux_fts_sell_hcancel', `Trying to cancel ${setname} mint token sell`)
//  }
// function tradeFTaccept(setname, uid, callback){
//      broadcastCJA({ set: setname, uid}, "dlux_ft_escrow_complete", `Trying to complete ${setname} mint tokentrade`)
//  }

// function tradeFTreject(setname, uid, callback){
//     broadcastCJA({ set: setname, uid }, "dlux_ft_escrow_cancel", `Trying to cancel ${setname} mint token trade`)
//  }

// function tradeFTcancel(setname, uid, callback){
//     broadcastCJA({ set: setname, uid }, "dlux_ft_escrow_cancel", `Trying to cancel ${setname} mint token trade`)
//  }

// NFT Transfers //

// function giveNFT(setname, uid, to, callback){
//     checkAccount(to)
//     .then(r => {
//         broadcastCJA({set: setname, uid, to}, "dlux_nft_transfer", `Trying to give ${setname}:${uid} to ${to}`) 
//     })
//     .catch(e=>alert(`${to} is not a valid hive account`))
//  }

// function tradeNFT(setname, uid, to, price, type, callback){
//     price = parseInt(price * 1000)
//     checkAccount(to)
//     .then(r => {
//         broadcastCJA({ set: setname, uid, to, price, type}, "dlux_nft_reserve_transfer", `Trying to trade ${setname}:${uid}`)
//     })
//     .catch(e=>alert(`${to} is not a valid hive account`))
//  }

// function sellNFT(setname, uid, price, type, callback){
//     price = parseInt(price * 1000)
//     broadcastCJA({ set: setname, uid, price, type}, "dlux_nft_sell", `Trying to list ${setname}:${uid} for sell`)
//  }

// function auctionNFT(setname, uid, price, now, time, type, callback){
//      time = parseInt(time)
//     price = parseInt(price * 1000)
//     if(type.toUpperCase() == 'HIVE'){
//         type = 'HIVE'
//     } else if(type.toUpperCase() == 'HBD'){
//         type = 'HBD'
//     } else {
//         type = 0
//     }
//     if(!type)broadcastCJA({ set: setname, uid, price, now, time}, "dlux_nft_auction", `Trying to auction ${setname}:${uid} for DLUX`)
//     else broadcastCJA({ set: setname, uid, price, type, now, time}, "dlux_nft_hauction", `Trying to auction ${setname}:${uid} for ${type}`)
//  }

// function deleteNFT(setname, uid, callback){
//     broadcastCJA({ set: setname, uid }, "dlux_nft_delete", `Trying to melt ${setname}:${uid}`) 
//  }


// NFT Actions //

//  function defineNFT(setname, type, script, permlink, start, end, total, royalty, handling, max_fee, bond, callback){
//     max_fee = parseInt(max_fee * 1000)
//     royalty = parseInt(royalty * 100)
//     type = parseInt(type)
//     bond = parseInt(bond * 1000)
//     //more validation
//     broadcastCJA({ name: setname, type, script, permlink, start, end, total, royalty, handling, max_fee, bond}, "dlux_nft_define", `Trying to define ${setname}`)
//  }

// function tradeNFTaccept(setname, uid, price, type, callback){
//     if(type.toUpperCase() == 'HIVE'){
//         broadcastTransfer({ to: 'dlux-cc', hive: price, memo:`NFTtrade ${setname}:${uid}`}, `Completing Trade ${setname}:${uid}`)
//     } else if (type.toUpperCase() == 'HBD'){
//         broadcastTransfer({ to: 'dlux-cc', hbd: price, memo:`NFTtrade ${setname}:${uid}`}, `Completing Trade ${setname}:${uid}`)
//     } else {
//         broadcastCJA({ set: setname, uid, price}, "dlux_nft_reserve_complete", `Trying to complete ${setname}:${uid} trade`)
//     }
//  }
// function tradeNFTreject(setname, uid, callback){
//     broadcastCJA({ set: setname, uid }, "dlux_nft_transfer_cancel", `Trying to cancel ${setname}:${uid} trade`)
//  }
// function tradeNFTcancel(setname, uid, callback){
//     broadcastCJA({ set: setname, uid }, "dlux_nft_transfer_cancel", `Trying to cancel ${setname}:${uid} trade`)
//  }
//  function sellNFTcancel(setname, uid, callback){
//      broadcastCJA({ set: setname, uid}, "dlux_nft_sell_cancel", `Trying to cancel ${setname}:${uid} sell`)
//  }
// function buyNFT(setname, uid, price, type, callback){
//     if (type.toUpperCase() == 'HIVE') broadcastTransfer({ to: 'dlux-cc', hive: price, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
//     else if (type.toUpperCase() == 'HBD') broadcastTransfer({ to: 'dlux-cc', hbd: price, memo:`NFTbuy ${setname}:${uid}`}, `Buying ${setname}:${uid}`)
//     else broadcastCJA({ set: setname, uid, price}, "dlux_nft_buy", `Trying to buy ${setname}:${uid}`)
//  }
//  function bidNFT(setname, uid, bid_amount, type, callback){
//     console.log({bid_amount, type})
//     bid_amount = parseInt(bid_amount * 1000)
//     if(type == 'HIVE') broadcastTransfer({ to: 'dlux-cc', hive: bid_amount, memo:`NFTbid ${setname}:${uid}`}, `Bidding on ${setname}:${uid}`)
//     else if (type == 'HBD') broadcastTransfer({ to: 'dlux-cc', hbd: bid_amount, memo:`NFTbid ${setname}:${uid}`}, `Bidding on ${setname}:${uid}`)
//     else broadcastCJA({ set: setname, uid, bid_amount}, "dlux_nft_bid", `Bidding on ${setname}:${uid} for ${parseFloat(bid_amount/1000).toFixed(3)} DLUX`)
//  }

// function setPFP(setname, uid, callback){
//     fetch("https://hive-api.dlux.io", {
//         body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${user}"]], "id":1}`,
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded"
//         },
//         method: "POST"
//         })
//         .then(r=>r.json())
//         .then(json=>{
//             if(JSON.parse(json.result[0].posting_json_metadata).profile.profile_image !== `https://data.dlux.io/pfp/${user}?${setname}-${uid}`){
//                 var pjm = JSON.parse(json.result[0].posting_json_metadata)
//                 pjm.profile.profile_image = `https://data.dlux.io/pfp/${user}?${setname}-${uid}`
//                 const op = 
//                     [
//                         ['custom_json', {
//                             "required_auths": [],
//                             "required_posting_auths": [user],
//                             "id": "dlux_nft_pfp",
//                             "json": JSON.stringify({
//                                 set: setname,
//                                 uid
//                             })
//                         }],
//                         ["account_update2",{
//                             "account": user,
//                             "json_metadata": "",
//                             "posting_json_metadata": JSON.stringify(pjm)}
//                         ]
//                     ]
//                 Dluxsession.hive_sign([user, op, 'posting'])
//                      .then(r => {
//                          statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
//                      })
//                      .catch(e => { console.log(e) })
//             } else {
//                 Dluxsession.hive_sign([user, [
//                     ['custom_json', {
//                         "required_auths": [],
//                         "required_posting_auths": [user],
//                         "id": "dlux_nft_pfp",
//                         "json": JSON.stringify({
//                             set: setname,
//                             uid
//                             })
//                         }]
//                      ], 'posting'])
//                 .then(r => {
//                     statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
//                 })
//                 .catch(e => { console.log(e) })
//             }
//         })
//         .catch(e=>{
//             console.log(e)
//             Dluxsession.hive_sign([user, [
//                 ['custom_json', {
//                     "required_auths": [user],
//                     "required_posting_auths": [],
//                     "id": "dlux_nft_pfp",
//                     "json": JSON.stringify({
//                         set: setname,
//                         uid
//                         })
//                     }]
//                 ], 'posting'])
//             .then(r => {
//                 statusWaiter (r, `Trying to set ${setname}:${uid} as PFP`)
//             })
//             .catch(e => { console.log(e) })
//         })
//  }

 function statusWaiter (res, what, api = 'token.dlux.io'){
     const txid = res.result.id
     const whatt = what || ''
     let node = document.createElement('div')
        node.id = txid
        node.innerHTML = `<div class="alert bg-dark border border-info rounded alert-dissmissible fade show ml-auto mr-3 my-3" style="max-width:500px;" role="alert">
			<div class="d-flex justify-content-between align-items-center text-white">
                <div id="${txid}-spinner" class="spinner-grow text-info mr-4" role="status"></div>
                <div class="d-flex flex-fill flex-column"> <strong><i class="fas fa-broadcast-tower mr-2"></i>Broadcast Successful</strong>
                <p id="${txid}-status" class="m-0">Awaiting DLUX L2 Confirmation:<span id="${txid}-timer" class="mx-1">90</span></p>
                <p id="${txid}-trying">${whatt}</p>
            </div>
            <button type="button" class="close text-white" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button>
          </div>
		</div>`
    document.getElementById('notificationholder').appendChild(node)
    updateDiv(txid)
    function updateDiv(id){
        try {
            const time = parseInt(document.getElementById(`${id}-timer`).innerText)
            document.getElementById(`${id}-timer`).innerText = time - 1
            setTimeout(function(){
                updateDiv(id)
            }, 1000);
            if (time < 90 && time % 2 == 0){
                fetch(`https://${api}/api/status/${id}`)
                .then(r => r.json())
                .then(json => {
                    console.log(json,json.status.slice(0,20))
                    if(json.status.slice(0,20) != 'This TransactionID e'){
                        if (json.status.indexOf(' minted ') > -1){
                            changeDiv(id, json.status, 'mint')
                            setTimeout(function(){
                                dismissDiv(id, json.status)
                            }, 30000);
                        } else {
                            changeDiv(id, json.status, true)
                            setTimeout(function(){
                                dismissDiv(id, json.status)
                            }, 20000);
                        }
                    }
                })
                .catch(e=>console.log(e))
            } else if(time <= 0){
                changeDiv(id, 'This transaction has not been accepted by the network or the network is having issues.', false)
                setTimeout(function(){
                    dismissDiv(id)
                }, 20000);
            }
        } catch (e) {console.log(e)}
    }
    function changeDiv(id, status, type){
        const Dindex = status.indexOf('DLUXQm')
        if(Dindex >= 0){
            const Eindex = status.indexOf(' ', Dindex)
            status = status.slice(0, Dindex) + status.slice(Eindex + 1)
        }
        if(type){
            if (type == 'mint'){
                //${b.for} minted ${selected} from the ${b.set} set.
                const set = status.split(' ')[5]
                const uid = status.split(' ')[2]
                document.getElementById(`${id}-spinner`).classList.remove('spinner-grow')
                document.getElementById(`${id}-spinner`).classList.remove('text-info')
                document.getElementById(`${id}-spinner`).innerHTML = `<img src="https://data.dlux.io/img/render/${set}/${uid}" alt="${set}:${uid}" width="200" height="200">`
            } else {
                document.getElementById(`${id}-spinner`).classList.replace('spinner-grow', 'fas')
                document.getElementById(`${id}-spinner`).classList.replace('text-info', 'fa-check-circle')
            }
        } else {
            document.getElementById(`${id}-spinner`).classList.replace('spinner-grow', 'fas')
            document.getElementById(`${id}-spinner`).classList.replace('spinner-grow', 'fa-times-circle')
        }
        let eL = document.getElementById(`${id}-trying`)
        eL.parentElement.removeChild(eL)
        document.getElementById(`${id}-status`).innerText = status
    }
    function dismissDiv(id){
        try{
            document.getElementById('notificationholder').removeChild(document.getElementById(id))
        } catch (e){console.log(e)}
    }
 }

 class Dluxsession {
     constructor(ip) {
         const opts = ip || {}
         this.email = opts.email || ''
         this.keychain = {
             installed: !!window.hive_keychain,
             active: false,
             posting: false,
             memo: false
         }
         this.hiveidip = ip.hiveidip
         this.hive = window.hive
         //this.account = opts.account
         this.hiveid = opts.hiveid || ''
         this.jwt = opts.jwt || ''
     }

     set account(obj) {
         return new Promise((r, e) => {
             if (obj !== null) {
                 setdata(obj.name)
                 this.metadata = JSON.parse(obj.json_metadata)
                 fetch(`/api/proxy?url=${this.metadata.profile.profile_image}`)
                     .then(validateResponse)
                     .then(readResponseAsBlob)
                     .then(showProfileImage)
                     .then(s => { r(s) })
                     .catch(err => {
                         console.log(err);
                         e(err)
                     });
             }
         });
     }

     set hiveidip(id) {
         var account = {},
             itr = {}
         return new Promise((resolve, reject) => {
             if (!user) {
                 console.log('Fresh login')
                 let ids = localStorage.getItem("user")
                 let idPromises = [Dluxsession.handshake(ids)]
                 Promise.all(idPromises)
                     .then(r => {
                         account = r[0].account
                         console.log(account)
                         let challengePromises = [Dluxsession.decode(ids, r[0].challenges[0])]
                         Promise.all(challengePromises)
                             .then(ret => {
                                 let itr = {}
                                 itr.jwt = ret[0]
                                 itr.user = ids
                                 itr.challenges = r[0].challenges
                                 itr.hiveid = ids
                                 let storables = ['email', 'hiveid', 'jwt', 'account']
                                 for (var i = 0; i < storables.length; i++) {
                                     console.log(itr[storables[i]])
                                     window.localStorage.setItem(storables[i], JSON.stringify(itr[storables[i]]))
                                 }
                                 loginDismiss()
                                 setCookie('user', itr.hiveid, 30)
                                 resolve(this.jwt)
                             })
                     })
             } else {
                 resolve(this.jwt)
             }
         });
     }

     static hive_sign(op) {
         return new Promise((resolve, reject) => {
             if (window.hive_keychain) {
                 try {
                     window.hive_keychain.requestBroadcast(op[0], op[1], op[2], function(response) {
                         console.log(response)
                         resolve(response)
                     });
                 } catch (e) {
                     reject(e)
                 }
             } else {
                 reject({ "error": "Hive Keychain is not installed." })
             }
         })
     }

     static handshake(id) {
         return new Promise((resolve, reject) => {
             fetch(`https://challenge.ipfs.dlux.io/api/account/${id}`)
                 .then((response) => {
                     return response.json();
                 })
                 .then((myJson) => {
                     resolve(myJson)
                 })
                 .catch((error) => {
                     reject(error)
                 })
         });
     }

     static iam(id) {
         return new Promise((resolve, reject) => {
             this.hive.api.getAccounts([id], function(err, response) {
                 if (err) {
                     reject(err)
                 } else {
                     resolve(response)
                 }
             });
         });
     }

     static challengeMe(id) {
         return new Promise((resolve, reject) => {
             this.hive.api.getAccounts([id], function(err, response) {
                 if (err) {
                     reject(err)
                 } else {
                     resolve(response)
                 }
             });
         });
     }

     static decode(self, encoded) {
         return new Promise((resolve, reject) => {
             var jwt = ''
             if (window.hive_keychain) {
                 try {
                     window.hive_keychain.requestVerifyKey(self, encoded[0], encoded[1], function(response) {
                         console.log(response);
                         jwt = response.result.substring(1, response.result.length - 1)
                         resolve(jwt)
                     });
                 } catch (e) {
                     reject('plant')
                 }
             } else {
                 let key = prompt(`Enter @${this.name}'s memo private key`, '5blahlblah')
                 try {
                     jwt = this.hive.memo.decode(key, encoded[0])
                     resolve(jwt)
                 } catch (e) {
                     reject('food')
                 }
             }
         })
     }

     static encode(msg, to) {
         return new Promise((resolve, reject) => {
             let encoded = this.hive.memo.encode(this.account.memoKey, encoded);
         })
     }

 }

 function setVotePower(pow, upobj, downobj, vp, block) {
    console.log(pow, upobj, downobj, vp, block)
    let up, dp, hp
    if (!Object.keys(upobj).length) {
        upobj = {
            max: pow * 50,
            last: 0,
            power: pow * 50
        }
        downobj = {
            max: pow * 50,
            last: 0,
            power: pow * 50
        }
    }
    const newPower = downPowerMagic(upobj, downobj, block)
    console.log({ newPower })
    up = parseInt(newPower.up.power / newPower.up.max) * 100
    console.log({ up })
    dp = parseInt(newPower.down.power / newPower.down.max) * 100
    console.log({ dp })
    hp = parseInt(vp / 100)
    console.log({ hp })
    document.getElementById('upvotePower').style = `width: ${up}%`
    document.getElementById('downvotePower').style = `width: ${dp}%`
    document.getElementById('resourceCredits').style = `width: ${hp}%`
    document.getElementById('upvotePower')['aria-valuenow'] = `${up}`
    document.getElementById('downvotePower')['aria-valuenow'] = `${dp}`
    document.getElementById('resourceCredits')['aria-valuenow'] = `${hp}`
    document.getElementById('upvotePowerSpan').innerText = `${up}%`
    document.getElementById('downvotePowerSpan').innerText = `${dp}%`
    document.getElementById('resourceCreditsSpan').innerText = `${hp}%`
    return newPower.vote
}

function downPowerMagic(up, down, block_num) {
    const downHealTime = block_num - down.last //144000 blocks in 5 days
    const downHeal = parseInt(down.max * downHealTime / 144000)
    const weight = 10000
    var newDownPower = down.power + downHeal
    if (newDownPower > down.max) {
        newDownPower = down.max
    }
    const healTime = block_num - up.last //144000 blocks in 5 days
    const heal = parseInt(up.max * healTime / 144000)
    var newPower = up.power + heal
    if (newPower > up.max) {
        newPower = up.max
    }
    //var bigSpender = false
    var vote = parseInt(newDownPower * weight / 500000) //5 from max AND 10000 from full weight
        //newDownPower -= downvote
    const newUp = {
        max: up.max,
        last: block_num,
        power: newPower
    }
    const newDown = {
        max: down.max,
        last: block_num,
        power: newDownPower
    }
    return { up: newUp, down: newDown, vote: vote }
}

function propCheck(user){
    return new Promise((resolve, reject)=>{
    var url171 = fetch("https://hive-api.dlux.io", {
        body: "{\"jsonrpc\":\"2.0\", \"method\":\"condenser_api.list_proposal_votes\", \"params\":[[171], 1000, \"by_proposal_voter\", \"ascending\", \"active\"], \"id\":1}",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST"
        })
    Promise.all([url171])
        .then(res=>Promise.all(res.map(res => res.json())))
        .then(r=>{
            var one71 = false
            for(i=0;i<r[0].result.length;i++){
                if(r[0].result[i].proposal.id != 171){
                    break;
                }
                if(r[0].result[i].voter == user){
                    one71 = true
                    break;
                }
            }
            resolve({one71})
        })
        .catch(e=>reject(e))
    });
}

String.prototype.commafy = function() {
    return this.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    });
};

Number.prototype.commafy = function() {
    return String(this).commafy();
};

function reqsign(op, req) { //requests keychain to sign and broadcast
    return new Promise((resolve, reject) => {
        Dluxsession.hive_sign([req[1],
                [op], req[0]
            ])
            .then(r => { resolve(r) })
            .catch(e => reject(e))
    })
}

// function voteProp(props, user) {
//     reqsign([
//             "update_proposal_votes",
//             {
//                 "voter": user,
//                 "proposal_ids": props,
//                 "approve": true
//             }
//         ], ['active', user])
//         .then(r => { feedback(r) })
//         .catch(e => { feedback(e) })
// }

// function insertBal(data, loc, atr) {
//     if (!atr) {
//         document.getElementById(loc).value = data
//     } else {
//         document.getElementById(loc)[atr] = data
//     }
// }