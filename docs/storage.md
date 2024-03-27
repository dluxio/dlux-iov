## SPK Network 

### Storage Documentation

#### Storing Files

You can build a storage contract backed by broca for the SPK Network. The difference between storing files for yourself(loading into IPFS) and storing on SPK network is mostly down to proving providence. This is so everybody who stores your files knows that you are ultimately responsible for what was uploaded.

A custom JSON must by signed with the folowing data.

##### Unconditional
```
id: spkcc_channel_open
json: {
  "broca": 100,
  "broker": "dlux-io",
  "to": "any-account",
  "contract": "0"
}
required_auths: [
  "your-account"
]
```
* id: spkcc_channel_open
   * The address of the smart contract
* "broca": 100
   * channel_bytes is the amount of bytes per Broca
   * channel_min is the minimum Broca to open a contract (spam filter)
   * Found at [/stats](https://spktest.dlux.io/stats)
   * @your-account must currently have this amount of Broca
* "broker": "dlux-io"
   * This account must have a registers IPFS service
   * Found at [/services/IPFS](https://spktest.dlux.io/services/IPFS)
* "to": "any-account"
   * This account must have a registered PubKey (for signing the upload offchain)
* "contract": "0"
   * Unconditional Contract
##### Conditional
```
id: spkcc_channel_open
json: {
  "broca": 30000,
  "broker": "dlux-io",
  "to": "disregardfiat",
  "contract": "1",
  "slots": "an-account,1000"
}
required_auths: [
  "your-account"
]
```
* Same as above with Contract Information
* "contract": "1"
   * Conditional Contract
   * Requires "slots" for the conditions
* "slots": "an-account,1000"
   * Any Hive Account before the comma
   * A percent (acctually a per 10 mil) => 1000 = 10.00%
* The condition for type 1 is a Hive post must be made with a benificary to "an-account" with at least xxxx fee.
   * "dlux-io,500" => 5% to @dlux-io
   * "spknetwork,1111" => 11.11% to @spknetwork