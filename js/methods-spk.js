export default {
broca_calc(last = '0,0', broca_refill = 144000, spk_power = 0, head_block = 0) {
    if (!spk_power) return 0;
    const last_calc = this.Base64toNumber(last.split(',')[1]);
    const accured = parseInt(parseFloat(broca_refill) * (head_block - last_calc) / (spk_power * 1000));
    var total = parseInt(last.split(',')[0]) + accured;
    if (total > spk_power * 1000) total = spk_power * 1000;
    return total;
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
}