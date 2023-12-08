const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddress } = require('@solana/spl-token');
const { TokenAccount, SPL_ACCOUNT_LAYOUT, LIQUIDITY_STATE_LAYOUT_V4 } = require('@raydium-io/raydium-sdk');
const fs = require('node:fs');
const account = require('etherscan-api/lib/account');
// const { OpenOrders } = require( '@project-serum/serum' );
let originalLog = console.log;
console.log = function (msg) {


    const time = new Date();
    let date = new Date();

    let hours = "", minutes = "", seconds = "";

    if (date.getHours() < 10)
        hours = "0" + date.getHours();
    else
        hours = date.getHours();

    if (date.getMinutes() < 10)
        minutes = "0" + date.getMinutes();
    else
        minutes = date.getMinutes();

    if (date.getSeconds() < 10)
        seconds = "0" + date.getSeconds();
    else
        seconds = date.getSeconds();

    const curtime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + hours + ":" + minutes + ":" + seconds;
    const log_file = "./Logs/SOLTrack_" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".log";
    if (fs.existsSync(log_file)) {
        fs.appendFile(log_file, ` [${curtime}] ${msg}\n`, err => {
            if (err) throw err;
        });
    } else {
        const dirPath = './Logs';

        if (!fs.existsSync(dirPath)) {
            fs.mkdir(dirPath, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
        fs.writeFile(log_file, `[${curtime}] ${msg}\n`, function (err) {
            if (err) throw err;
        });
    }
    if (msg == `BOT::CRASH`)
        process.exit();
    return originalLog(`: [${curtime}] ${msg}`);
}

 const connection = new Connection("https://divine-fittest-night.solana-mainnet.quiknode.pro/18f5be82ddbeb55a0abbf795bcf5a166b33d95fe/",{
//const connection = new Connection("https://api.mainnet-beta.solana.com", {
    commitment: 'confirmed',
    maxRetries: 5,
    maxRetryIntervalMillis: 500,
    timeout: 30000,
    maxSupportedTransactionVersion: 0, // Add this line to specify the max supported transaction version
});

//Raydium Liquidity Pool V4
const RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
const RAYDIUM_PROGRAM_V5_ID = 'Rayd7Qo7oLGznHVXtXg7gYysbjoBWa3dMwW7xgDDQp5b'
//ORCA
const ORCA_PROGRAM_ID = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';
//FluxBeam
const FLUXBEAM_PROGRAM_ID = 'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X';

const QUEUE_SIZE = 70000;
let isRDProcessing = false;
const accountRDQueue = [];
let tx_counter = 0;
let raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID);;

let last_signature = null;
const getCreateSignature = async (pool = 'Bjfvk2nTKTYw3rMD2nMJneMr1EUdG7gJWT8LvjkxHUF1') => {
    const lbd_pool = new PublicKey("Bjfvk2nTKTYw3rMD2nMJneMr1EUdG7gJWT8LvjkxHUF1");;

    const poolAddress = new PublicKey('695pfhJ3ezMSLqWP58yCJ1RPzRBGeZoT9UGECuogcKMq');

    // const filters = [
    //     {
    //         memcmp: {
    //             offset: 32, // Offset of the pool address in the account data
    //             bytes: lbd_pool.toBase58(),
    //         },
    //     },
    // ];
    console.log("waaa");
    try {

        const accounts = await connection.getProgramAccounts(raydiumProgramId, {
            Commitment :"finalized"
        });

        if (accounts.length > 0) {
            const filtered = accounts.filter(account => account.pubkey == "How7TQfSM1k9uJ95auhrQTHDFqsbsA9vrdvdMQNnB3AF");
            for(const acc of filtered ){
                

                const buffer = Buffer.from(acc.account.data);

// // Decode the token account data
// const token = new Token(connection, tokenAccount, programId,  null);
// const decodedData = await token.getAccountInfo(buffer);
// console.log(`Account Data : ${decodedData}`);


                console.log(`Account Pubkey : ${acc.pubkey}`);
                const RaydiumPairAccount = new PublicKey(acc.account.data.slice(0, 32));
                console.log(`Account Data 0 : ${RaydiumPairAccount}`);
                const RaydiumPairAccount1 = new PublicKey(acc.account.data.slice(32, 64));
                console.log(`Account Data 1  : ${RaydiumPairAccount1}`);
                const RaydiumPairAccount2 = new PublicKey(acc.account.data.slice(64, 96));
                console.log(`Account Data 2  : ${RaydiumPairAccount2}`);
            }
            
        } else {
            console.log('No account found for the given address');
        }
    } catch (e) {
        console.log(`LOOOO ${JSON.stringify(e)}, ${e}`)
    }


}
async function monitorProgramAccountChange(acc_info)
{
    try {
        if(acc_info.accountId == "How7TQfSM1k9uJ95auhrQTHDFqsbsA9vrdvdMQNnB3AF")
            console.log(`PA-Change: ${JSON.stringify(acc_info)}`);

        // while (accountRDQueue.length > 0) {
        //     const nextRDAccountInfo = accountRDQueue.shift();

        //     const RaydiumPairAccount = new PublicKey(nextRDAccountInfo.accountInfo.data.slice(0, 32));
        //     console.log(`Pair Account : ${RaydiumPairAccount}\n`);
        // }
    } catch (e) {
        console.log("onProgramAccountChange : err :", e);
    } finally {
    }
}

function registerMonitor() {
    const pa_change = connection.onProgramAccountChange(
        raydiumProgramId,monitorProgramAccountChange);
}
const monitorRaydiumActivity = async () => {
    const sig_opts = last_signature == null ? { limit: 200 } : { limit: 200, until: last_signature };
    const signatures = await connection.getConfirmedSignaturesForAddress2(raydiumProgramId, sig_opts);
    last_signature = signatures[0].signature;
    console.log(`Last signature : ${last_signature}`);
    const signatures_no_err = signatures.filter((sig) => sig.err == null);


    // const transactions = await connection.getTransactions(signatures_no_err.map(sig => sig.signature), {
    //     maxSupportedTransactionVersion: 0,
    // });
    const transactions = await connection.getParsedTransactions(signatures_no_err.map(sig => sig.signature), {
        maxSupportedTransactionVersion: 0,
    });
    console.log(`signatures_no_err: ${JSON.stringify(transactions)}`);
    //console.log(`transactions: ${JSON.stringify(transactions)}`);


    // const promises = signatures.map(tx => {
    //     return test(tx);
    // });

    // await Promise.all(promises.map(promise => promise.catch(error => {
    //     console.error(`while analyse block  ${error}`);
    // })));


    //console.log(`${tx_counter} : ${JSON.stringify(transactions)}`);
    //   const initializeTransactions = transactions.filter(tx => tx.instructions.some(instruction => instruction.programId.equals(programId) && instruction.data.includes('initialize')));

    //   // Extract pool IDs from initialize transactions
    //   const poolIds = initializeTransactions.map(tx => tx.transaction.message.accountKeys[1].toBase58());
    // console.log(`${tx_counter} : ${JSON.stringify(poolIds)}`);
    return;
    
};

const monitorORCAActivity = () => {
    const programId = new PublicKey(ORCA_PROGRAM_ID);

    // Monitor token deployments
    const tokenSubscription = connection.onProgramAccountChange(
        programId,
        (accountInfo) => {
            console.log('New token deployment detected:');
            console.log(accountInfo);
        }
    );

    // Monitor liquidity changes
    const liquiditySubscription = connection.onAccountChange(
        programId,
        (accountInfo) => {
            console.log('Liquidity change detected:');
            console.log(accountInfo);
        }
    );
};

const monitorFluxBeamActivity = () => {
    const programId = new PublicKey(FLUXBEAM_PROGRAM_ID);

    // Monitor token deployments
    const tokenSubscription = connection.onProgramAccountChange(
        programId,
        (accountInfo) => {
            console.log('FluxBeam token deployment detected:');
            console.log(accountInfo);
        }
    );

    // Monitor liquidity changes
    const liquiditySubscription = connection.onAccountChange(
        programId,
        (accountInfo) => {
            console.log('Liquidity change detected:');
            console.log(accountInfo);
        }
    );
};

async function getTokenAccounts(connection, owner) {
    const tokenResp = await connection.getTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
    });

    console.log("getTokenAccounts 0 : ", JSON.stringify(tokenResp));

    const accounts = [];
    for (const { pubkey, account } of tokenResp.value) {
        accounts.push({
            pubkey,
            accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
        });
    }
    console.log("getTokenAccounts : ", JSON.stringify(accounts));
    return accounts;
}

async function parsePoolInfo(owner) {
    const tokenAccounts = await getTokenAccounts(connection, owner);
    console.log("parsePool 1 :", tokenAccounts);
    // example to get pool info
    const info = await connection.getAccountInfo(new PublicKey(RAYDIUM_PROGRAM_ID));
    if (!info) return;

    const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);

    const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
    const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();

    const baseTokenAmount = await connection.getTokenAccountBalance(
        poolState.baseVault
    );
    const quoteTokenAmount = await connection.getTokenAccountBalance(
        poolState.quoteVault
    );

    const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
    const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

    // const openOrdersBaseTokenTotal =
    //   openOrders.baseTokenTotal.toNumber() / baseDecimal;
    // const openOrdersQuoteTokenTotal =
    //   openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

    // const base =
    //   (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
    // const quote =
    //   (quoteTokenAmount.value?.uiAmount || 0) +
    //   openOrdersQuoteTokenTotal -
    //   quotePnl;

    const denominator = new BN(10).pow(poolState.baseDecimal);

    const addedLpAccount = tokenAccounts.find((a) =>
        a.accountInfo.mint.equals(poolState.lpMint)
    );

    console.log(
        "SOL_USDC pool info:",
        // "pool total base " + base,
        // "pool total quote " + quote,

        "base vault balance " + baseTokenAmount.value.uiAmount,
        "quote vault balance " + quoteTokenAmount.value.uiAmount,

        // "base tokens in openorders " + openOrdersBaseTokenTotal,
        // "quote tokens in openorders  " + openOrdersQuoteTokenTotal,

        "base token decimals " + poolState.baseDecimal.toNumber(),
        "quote token decimals " + poolState.quoteDecimal.toNumber(),
        "total lp " + poolState.lpReserve.div(denominator).toString(),

        "addedLpAmount " +
        (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal
    );
}

async function getRaydiumPairAddress(pairAccount) {

}

registerMonitor();
//monitorRaydiumActivity();
//monitorRaydiumActivity();
getCreateSignature();
// const checkingHealth = setInterval(
//     () => {
//         console.log("========================");
//         monitorRaydiumActivity();

//     },
//     10000,
// );
// Promise.all([monitorRaydiumActivity(), monitorFluxBeamActivity(), monitorORCAActivity()])
//   .then(() => {
//     console.log('Monitoring FluxBeam and ORCA activity...');
//   })
//   .catch((error) => {
//     console.error('Error occurred:', error);
//   });