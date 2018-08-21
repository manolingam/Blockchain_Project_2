//Imported SHA256 to generate hash.. 
const SHA256 = require('crypto-js/sha256');

//Imported LevelDB for data storage..
const level = require('level');

//To store Chain data..
const chainDB = './chaindata';
const db = level(chainDB, {valueEncoding: 'json'});

//To store key values..
const keyDB = './keydata';
const db2 = level(keyDB);

//Class for Blocks..
class Block{
  constructor(data){
      this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = "";
    }
 }

//Class for Blockchain..
class Blockchain{
  constructor(){
      this.chain = []; //A Temporary array to store chain..
      this.addBlocktoLevelDB(new Block("Genesis Block"));
    }

  //Method for adding new blocks..
  addBlocktoLevelDB(newBlock){

    //Stores temporary height..
    newBlock.height = this.chain.length;

    //Stores UTC time..
    newBlock.time = new Date().getTime().toString().slice(0,-3);

    //Getting previous Block hash..
    if(this.chain.length>0){
      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
    }

    //Current Block hash..
    newBlock.hash = SHA256(JSON.stringify(newBlock.body) + newBlock.height + newBlock.previousBlockHash).toString();
    
    //Pushing Block into chain..
    this.chain.push(newBlock);
    
    //Checking whether the block is a genesis block to store permanently in database..
    if(this.chain.length == 1){
      
      //Storing Key in keydata database..
      db2.put('key', this.chain[0].height, function(err){}); 
      
      //Storing Chain in chaindata database..
      db.put(newBlock.height, {height: this.chain[0].height, hash: this.chain[0].hash, body:this.chain[0].body,
          time: this.chain[0].time, previousBlockHash: this.chain[0].previousBlockHash}, function(err) {
            if (err) 
              return console.log('Block ' + key + ' submission failed', err);  
            })
          
    //Executed when the block is not a genesis block..  
    }else{

      //Storing key in keydata database..
      db2.put('key', this.chain[this.chain.length-1].height, function(err){});

      //Storing Chain in chaindata database..
      db.put(newBlock.height, {height: this.chain[this.chain.length-1].height, hash: this.chain[this.chain.length-1].hash,
        body: this.chain[this.chain.length-1].body, time: this.chain[this.chain.length-1].time, 
        previousBlockHash: this.chain[this.chain.length-1].previousBlockHash }, function(err) {
          if (err) 
            return console.log('Block ' + key + ' submission failed', err);
      })   
    }      
  }
}

//Seperate class for validating blocks, getting info etc..
class Validation{

  //Get's Block height..
  getBlockHeight(){
    db2.get('key', function(err, key){
      console.log('Current Height of the Block is '+key);
    })
  }

  //Get's Block by it's height..
  getBlock(blockHeight){
    db.get(blockHeight, function(err, value){
      if(err) return err;
      console.log(value);
    })
  }

  //Get's entire Blockchain..
  getBlockchain(){

    //Get's all the stores keys..
    db.createKeyStream()
    .on('data', function (data) {

      //Get's each key's block..
      db.get(data, function(err, value){
        if(err) return err;
        console.log('Block height: ' + value.height + '\n' + 'Hash: ' + value.hash + '\n' + 'Data: ' + value.body + 
                   '\n' + 'Time: ' + value.time + '\n' + 'Previous Hash: ' + value.previousBlockHash + '\n');
      })  
    })
     
  }

  //Validates a Block..
  validateBlock(blockHeight){

    //Get's Block by it's height..
    db.get(blockHeight, function(err, value){
      if(err) return err;

        //Stores the stored hash value..
        let hash = value.hash;
        console.log('Original Hash: '+ hash);

        //Recomputing thr hash..
        let checkHash = SHA256(JSON.stringify(value.body) + value.height + value.previousBlockHash).toString();
        console.log('Recomputed Hash: '+ checkHash);

        //Checking whether both hash are same..
        if(hash === checkHash){console.log("Block Valid!")}else{
          console.log("Block Invalid!")
        }
    })
  }

  //Validates the entire Blockchain..
  validateBlockchain(){

    //Stores keys in this array..
    let array = [];

    //Get's keys..
    db2.get('key', function(err, key){
      for(var i=0; i<=key; i++){
        array[i] = i;
      }
      for(i = 0; i<array.length-1; i++){
        let index = i;

        //Get's current block's hash..
        db.get(i, function(err,value){
        //Passing the hash and index to the function..  
        blockValidateFinal(value.hash,index);
        })
      }
    })
  }
}


let err = false; //A variable for getting error values while validating blockchain..

//Final level of chain validation..
function blockValidateFinal(hash,index){
  previousHash = index+1;

  //Get's the previous hash from the next block..
  db.get(previousHash, function(err, value){
    console.log('Validating & Verifying..')

    //Validating if previous block hash is linked with current block..
    if( hash === value.previousBlockHash){
      console.log('Hash '+hash+' & Previous Hash '+value.previousBlockHash+' Matches!')
      err = true;
      if(err){
        console.log('Pass!')
      }else{
        console.log("Fail!");
      }
    }
  })
}

// blockchain object is used to add blocks..
/*Comment the below 5 lines after adding blocks to the chain, 
so that the next time the validation can be done..*/

let blockchain = new Blockchain();
blockchain.addBlocktoLevelDB(new Block("Block 1"));
blockchain.addBlocktoLevelDB(new Block("Block 2"));
blockchain.addBlocktoLevelDB(new Block("Block 3"));
blockchain.addBlocktoLevelDB(new Block("Block 4"));

//validate object is used to validate and get block, blockchain..
/* Uncomment the below lines after the blocks are added to start validating, retrieving etc..*/

//let validate = new Validation();
//validate.getBlockchain();
//validate.getBlock(4);
//validate.getBlockHeight();
//validate.validateBlock(0);
//validate.validateBlockchain();