const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

$log = console.log;

//--- MAIN ---
Read_Words().then( () => 
{
    $log("Finished reading...");
});

function Read_Words ()
{
    return new Promise( (resolve, reject) =>
    {
        let dir = "./LeDictionary/";
        let file= "words_alpha.txt";
        //
        let wordList = FS.readFileSync(dir+file);
        $log(wordList.toString())
        //$log(wordList[10])

        resolve();
        return;
    });
}


function Get_WordList_Oxford_5000 ()
{



}


