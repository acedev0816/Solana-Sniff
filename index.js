import * as web3 from "@solana/web3.js"
import * as spl from "@solana/spl-token"
const connection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"))
const publicKey = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
// const publicKey = new web3.PublicKey('EVsMmXkcDV8PPECgtxT4dsL5KjYgrhfPUiEQKitTfwwt'); 
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
while (true) {
  const transactions = await connection.getSignaturesForAddress(publicKey);
  const signatures = transactions.map(t => t.signature);
  for (let i = 0; i < transactions.length; i += 50) {
    await delay(10000)
    let transactionDetails = await connection.getParsedTransactions(signatures.slice(i, i + 50), { maxSupportedTransactionVersion: 0 })
    console.log("details", transactionDetails.length);
    for (const t of transactionDetails) {
      // console.log(t.transaction.message.instructions)
      const instructions = t.transaction.message.instructions
      if (instructions.length == 2 &&
        instructions[0].parsed && instructions[0].parsed.type == "createAccount" &&
        instructions[1].parsed && instructions[1].parsed.type == "initializeMint"
      ) {
        const mint = instructions[0].parsed.info.newAccount;
        console.log(`Token created: ${mint}`)
      }
    }
  }

}