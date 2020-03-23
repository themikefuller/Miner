'use strict';

function Miner() {

  let miner = {};

  miner.mine = (data, diff, initial_nonce, max) => {
    return new Promise((resolve, reject) => {

      let time = Date.now();
      let progress;
      let tries = parseInt(max) || 1;

      let Next = async (data, diff, nonce) => {
        let attempt = new TextEncoder().encode(data + parseInt(nonce).toString());
        let buffer = await crypto.subtle.digest('SHA-256', attempt);
        let hash = Array.from(new Uint8Array(buffer)).map(val => {
          return ('00' + val.toString(16)).slice(-2);
        }).join('');
        progress = nonce;
        tries--;
        if (hash.substring(0, diff.length) !== diff) {
          Fail(data, diff, nonce);
        } else {
          Pass(hash, data, diff, nonce);
        }
      };

      let Fail = (data, diff, nonce) => {
        if (tries > 0) {
          Next(data, diff, nonce + 1);
        } else {
          reject({
            "error": "Failed to mine in " + max + " tries.",
            "data": data,
            "diff": diff,
            "progress": progress,
            "cost": (Date.now() - time) / 1000
          });
        }
      };

      let Pass = (hash, data, diff, nonce) => {
        resolve({
          "hash": hash,
          "data": data,
          "diff": diff,
          "nonce": nonce,
          "cost": (Date.now() - time) / 1000
        });
      };

      let Start = () => {
        Next(data, diff, parseInt(initial_nonce) || 0);
      };

      Start();

    });

  };

  miner.prove = (hash, data, diff, nonce) => {
    return new Promise((resolve, reject) => {
      miner.mine(data, diff, nonce).then(result => {
        if (hash === result.hash) {
          resolve({
            "verified": true,
            "result": result
          });
        } else {
          reject({
            "verified": false
          });
        }
      }).catch(err => {
        reject({
          "verified": false
        });
      });
    });
  };

  return miner;

}
