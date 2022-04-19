## Start A New Node

<iframe width="560" height="315" src="https://3speak.tv/embed?v=disregardfiat/qemwclua" frameborder="0"  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### Prerequisites

* [Hive account](https://signup.hive.io/) with 100 Hive Power worth of Resource Credits available
* SSH private and .pub key for your computer ([Mac/Linux](https://docs.oracle.com/en/cloud/cloud-at-customer/occ-get-started/generate-ssh-key-pair.html), [Windows](https://docs.joyent.com/public-cloud/getting-started/ssh-keys/generating-an-ssh-key-manually/manually-generating-your-ssh-key-in-windows))
* Domain Name Registrar such as [Namecheap](https://namecheap.com/) for your API domain name

---

### Generate Node Key Pair
This is like a witness key pair and is additional to your account. Since you are not creating a new account, these keys are not tied to any Hive user and are merely a cryptographic key pair.
1. Go to [Account Creator](https://hivetasks.com/account-creator)
2. Type in anything for Account Name and click `Generate`
3. Save the `Active Private` and `Active Public` keys somewhere

---

### Configure API Domain
1. Login to your DNS manager
2. Go to Advanced DNS for the domain name
3.  Add an `A record` subdomain
   - Host: `username` or your preference
   - Value: `IP.ADD.RE.SS` of your server

---

### Get Server (Privex)
You may use any server of your choosing. Privex is chosen because it is Hive friendly, [IPFS](https://ipfs.io/) friendly, and can be paid in Hive or HBD.

Go to [Privex server](https://www.privex.io) or equivalent of your choosing:

1. Choose a server that meets the following requirements:
   - Region: `Allowed to run IPFS` (currently USA & Sweden)
   - Min specs: `Virtual Dual-Core 1GB / 25GB` (check specific community guidelines)
2. Enter your details
   - Name: `username` or your preference
   - Email: `your@preferen.ce`
   - Server Hostname: `mynodeserver` or your preference
   - Purpose: `Hive Layer 2`
   - Operating System: `Ubuntu latest` (currently 20.xx)
   - SSH Keys: `sshkey.pub`
3. Login to your server
   - Privex will send an email with IP Address and username
   - Open Terminal or equivalent
   - Locate your SSH private key file
   - Type: `ssh -i "sshkey" user@IP.ADD.RE.SS`
   - Add this connection to the list of known hosts 
4. Update packages and install Docker
   - Type `sudo apt update` to update repos
   - Type `sudo apt upgrade` to upgrade packages
   - Type `sudo apt install docker docker-compose` to install Docker
5. Reboot the server
   - Type `sudo reboot` to reboot if needed

---

### Docker Deploy
Once you have an up-to-date ubuntu server with docker, you can install Honeycomb nodes. Do this by cloning the repo for the community you want to run.

1. Clone the appropriate Honeycomb repo and move to its directory
- [Honeycomb:](https://github.com/disregardfiat/honeycomb.git) Type `git clone https://github.com/disregardfiat/honeycomb.git cd honeycomb`
- [DLUX:](https://github.com/dluxio/dlux_open_token.git) Type `git clone https://github.com/dluxio/dlux_open_token.git cd dlux_open_token`
- [SPKCC:](https://github.com/3speaknetwork/honeycomb-spkcc.git) Type `git clone https://github.com/3speaknetwork/honeycomb-spkcc.git cd honeycomb-spkcc`
- [DUAT:]() Type `git clone https://github.com/disregardfiat/honeycomb.git && cd honeycomb && git checkout raganarok`

2. Type `touch .env && nano .env` to edit the node attributes
   - Type the following into the text editor: 
```
account="hiveaccount"
active=5JactivePrivateKey
msowner=5KadditionalPrivateKey
mspublic=STMpublickey
domain=https://api.yourdomain.com
```
   - Optionally you can include `discordwebhook=https://discordapp.com/api/webhooks/NUMB3RS/KeYs` to stream the feed into a discord channel
3. Save & exit
   - Type `ctrl-x` or equivalent
   - Type `y` to save
   - Filename: `.env` press `Enter`
4. Type `sudo docker-compose build` to build the Docker environment
5. Type `sudo docker-compose up` to deploy the Docker environment

---

### nginx setup
Finally, install certbot to manage the SSL certificate for the API domain

1. Type `sudo apt install nginx certbot python3-certbot-nginx`
2. Select `nginx-full`
3.  `sudo nano /etc/nginx/sites-availible/default`
   * Enter and save:
```
server{
server_name location.yourdomain.io;

        location / {
                proxy_pass http://127.0.0.1:3001;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
        }
}
```
4.  `sudo systemctl reload nginx`
5.  Ensure your DNS information points to your server and run `sudo certbot`

