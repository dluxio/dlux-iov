// Import necessary functions from common methods
import common from './methods-common.js';
const Base64toNumber = common.Base64toNumber;
const toBase58 = common.toBase58;

export default {
broca_calc(last = '0,0', broca_refill = 144000, spk_power = 0, head_block = 0) {
    if (!spk_power) return 0;
    const last_calc = Base64toNumber(last.split(',')[1]);
    const accured = parseInt(parseFloat(broca_refill) * (head_block - last_calc) / (spk_power * 1000));
    var total = parseInt(last.split(',')[0]) + accured;
    if (total > spk_power * 1000) total = spk_power * 1000;
    return total;
  },
  rewardClaim() {
    this.toSign = {
      type: "cj",
      cj: {},
      id: `spkcc_reward_claim`,
      msg: `Claiming SPK...`,
      ops: ["getTokenUser"],
      txid: "reward_claim",
    };
  },
  reward_spk(saccountapi, sstats) {
    var r = 0,
      a = 0,
      b = 0,
      c = 0,
      t = 0,
      diff = saccountapi.head_block - saccountapi.spk_block;
    if (!saccountapi.spk_block) {
      return 0;
    } else if (diff < 28800) {
      return 0;
    } else {
      t = parseInt(diff / 28800);
      a = saccountapi.gov ? simpleInterest(saccountapi.gov, t, sstats.spk_rate_lgov) : 0;
      b = saccountapi.pow ? simpleInterest(saccountapi.pow, t, sstats.spk_rate_lpow) : 0;
      c = simpleInterest(parseInt(saccountapi.granted?.t > 0 ? saccountapi.granted.t : 0) + parseInt(saccountapi.granting?.t > 0 ? saccountapi.granting.t : 0), t, sstats.spk_rate_ldel);
      console.log({
        a,
        b,
        c,
        t,
        diff
      }, saccountapi.granted?.t);
      const i = a + b + c;
      if (i) {
        return i;
      } else {
        return 0;
      }
    }
    function simpleInterest(p, t, r) {
      const amount = p * (1 + parseFloat(r) / 365);
      const interest = amount - p;
      return parseInt(interest * t);
    }
  },
  isValidThumb(string) {
      if (typeof string === 'string') {
          if (string.startsWith("data:image/")) return string;
          if (string.startsWith("https://")) return string;
          else if (string.startsWith("Qm")) return `https://ipfs.dlux.io/ipfs/${string}`;
      }
      return "";
  },
  flagsDecode(flags = "", Base64toNumberFunc = Base64toNumber, only = 0, omit = 0) {
      // Expects Base64toNumber function to be passed or uses the imported one
      var num = typeof flags == "string" ? Base64toNumberFunc(flags[0]) : flags
      var out = []
      if (only) num = num & only
      if (omit) num = num & ~omit
      // Icons/text can be customized in the component using this base data
      if (num & 1) out.push({ name: "Encrypted", flag: 1 }); // fa: 'fa-solid fa-lock text-primary fa-fw'
      if (num & 2) out.push({ name: "Thumbnail", flag: 2 }); // fa: 'fa-solid fa-arrows-rotate text-success fa-fw fa-spin'
      if (num & 4) out.push({ name: "NSFW", flag: 4 }); // fa: 'fa-solid fa-radiation text-warning fa-fw'
      if (num & 8) out.push({ name: "Executable", flag: 8 }); // fa: 'fa-regular fa-file-code text-info fa-fw'
      return out
  },
  labelsDecode(flags = "", labelsMap = {}, only = -1) {
      // Expects labelsMap = { "0": { fa: "...", l: "...", c: 0 }, ... }
      var arr = []
      if (!labelsMap || typeof flags !== 'string' || flags.length === 0) return arr
      const len = only >= 0 ? 1 : flags.length
      for (var i = (only >= 0 ? only : 0); i < len; i++) {
          if(labelsMap[flags[i]]) {
              arr.push(labelsMap[flags[i]])
          }
      }
      arr = new Set(arr) // Ensure uniqueness
      return new Array(...arr)
  },
  downloadIPFS(fileInfo, downloadName = null) {
      // Only handles IPFS hash download, not data blob
      const name = downloadName || fileInfo;
      fetch(`https://ipfs.dlux.io/ipfs/${fileInfo}`)
          .then((response) => response.blob())
          .then((blob) => {
              var url = window.URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = name;
              document.body.appendChild(a); // Required for Firefox
              a.click();
              // Clean up: remove the element and revoke the URL
              a.remove();
              window.URL.revokeObjectURL(url);
          })
          .catch(e => {
              console.error("Error downloading IPFS file:", e);
              alert("Failed to download file from IPFS.");
          });
  },
  smartThumb(id, cid, newMetaMap) {
      // Expects newMetaMap = { contractId: { fileId: { thumb: '...' } } }
      const thumbData = newMetaMap?.[id]?.[cid]?.thumb;
      if (typeof thumbData === 'string') {
          if (thumbData.includes('https://')) {
              return thumbData;
          } else if (thumbData.startsWith('Qm')) {
              return `https://ipfs.dlux.io/ipfs/${thumbData}`;
          }
      }
      return false; // Return false or a placeholder if no valid thumb
  },
  parseFolderList(folderListStr, toBase58Func = toBase58) {
       // Expects toBase58 function to be passed or uses the imported one
      if (!folderListStr) return { "1": "" }; // Default root if empty
      var folderEntries = folderListStr.split("|").filter(Boolean);
      const indexToPath = {
          // Preset folders with fixed indices
          "1": folderEntries[0] || "", // Root or first custom folder name? Let's assume root or first entry
          "2": "Documents",
          "3": "Images",
          "4": "Videos",
          "5": "Music",
          "6": "Archives",
          "7": "Code",
          "8": "Designs",
          "9": "Misc",
      };
      
      // Handle potential case where root entry might be missing if first entry is a preset name
      if(!folderEntries.length || folderEntries[0] === "Documents") {
          indexToPath["1"] = ""; // Explicitly set root path if first entry isn't root name
      } else {
          indexToPath["1"] = folderEntries[0]; // Use the first entry as the root name
          folderEntries = folderEntries.slice(1); // Remove the root name entry
      }

      let currentIndex = 10; // Start custom indices after presets

      for (const entry of folderEntries) {
          let fullPath;
          let folderName = entry;
          let parentIndex = "1"; // Default parent is root

          if (entry.includes("/")) {
              [parentIndex, folderName] = entry.split("/");
              const parentPath = indexToPath[parentIndex];
              if (parentPath === undefined) { // Check for undefined instead of !parentPath
                  console.error(`Parent index ${parentIndex} not found for entry ${entry}`);
                  continue; // Skip if parent path can't be determined
              }
              fullPath = parentPath ? `${parentPath}/${folderName}` : folderName; // Handle root parent case
          } else {
              // This entry is a top-level folder (child of root)
              fullPath = folderName;
              // Check if it's a preset name (already handled above), skip if so?
              if (["Documents", "Images", "Videos", "Music", "Archives", "Code", "Designs", "Misc"].includes(folderName)) {
                  continue; // Presets are already mapped
              }
          }
          
          // Assign index. Need to find the correct *numeric* value for currentIndex
          const index = toBase58Func(currentIndex); 
          indexToPath[index] = fullPath;
          currentIndex++;
      }
      return indexToPath;
  },
}