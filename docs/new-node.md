## Running A Node

### Prerequisites

* [Hive account](https://signup.hive.io/) with 100 Hive Power
* SSH .pub key for your computer
* [Generate](https://hivetasks.com/account-creator) an additional Hive key pair

### Get Privex Server
You may use any server of your choosing. Privex is chosen because it is Hive friendly, [IPFS](https://ipfs.io/) friendly, and can be paid in Hive or HBD.

1. Go to [Privex server](https://www.privex.io) or equivalent of your choosing 
2. Choose a server that meets the following requirements:
   - Region: `Allowed to run IPFS` (currently USA & Sweden)
   - Min specs: `Virtual Dual-Core 1GB / 25GB` (check specific community guidelines)
3. Enter your details
   - Name: Hive `username` or your preference
   - Email: `your@preferen.ce`
   - Server Hostname: `mynodeserver` or your preference
   - Purpose: `Hive Layer 2`
   - Operating System: `Ubuntu latest (20)`
   - SSH Keys: `.pub`
4. Setup API domain (optional)
   - Login to your DNS manager
   - Add an A record subdomain
   - Host: `username` or your preference
   - Value: `IP address` of your server
5. 

### Privex Docker Deploy

* Instructions for Ubuntu follow:
* `sudo apt install docker docker-compose` --install dependencies
* `git clone https://github.com/disregardfiat/honeycomb.git` --download this repo
* `cd honeycomb` --change working directory
* Edit your node specifics via `touch .env && nano .env`
   * Contents: 
```
account="hiveaccount"
active=5JactivePrivateKey
msowner=5KadditionalPrivateKey
mspublic=STMpublickey
```
* `sudo docker-compose build` --Build Docker environment
* `sudo docker-compose up` --Deploy Docker environment

### nginx setup
* `sudo apt install nginx certbot python3-certbot-nginx`
    Select `nginx-full`
* `sudo nano /etc/nginx/sites-availible/default`
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
* `sudo systemctl reload nginx`
* Ensure your DNS information points to your server and run `sudo certbot`



### Server Installation


* Clone this repository

`git clone https://github.com/disregardfiat/honeycomb.git`

* Navigate to the root directory of token

`cd honeycomb`

* Set configuration variables

`nano .env` or your favorite editor

`account=hiveaccount
active=hiveactivekey`

* Quit editor and save changes

* Install

`npm install`

* Start

`npm start`

### Recommendations

* Script a way to automatically git pull to stay up to date with daily changes.
* Setup a system service to restart on quits to keep your node online.

### Cloud Installation

* Choose a cloud provider
* Fork this repository
* Connect your fork to the cloud server
* Set configuration variables

`account=hiveaccount`

`active=hiveactivekey`



