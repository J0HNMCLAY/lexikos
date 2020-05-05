const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

//# My Packages
const WordClass    = require('./Word_Class.js');
const StateMachine = require('./State_Machine.js');

$log = console.log;


//-Http Requests
let pronunce_URL  = 'https://www.google.com/search?q=pronounce+'


//- EDITBLES -------------------------
let ACTIVE_WORD = 'rush';

// ---MAIN CODE ---------------------
Main()



//-Main
async function Main ()
{
    await Get_Pronunciation();

    await $log('---Finish Code---')
}

//-METHOD ---------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
async function Get_Pronunciation() {
    return new Promise((resolve, reject) => {
        //-Build the URL
        let word = UTL_URL_WordFormat(ACTIVE_WORD);
        let Google_URL = (pronunce_URL + word);

        $log(`Get Pronunciation URL::${Google_URL}`)

        //-Make the request...
        axios.get(Google_URL).then((response) => {

            const $ = cheerio.load(response.data);

            $('span').each((i, e) => {
                let _text = $(e).text();
                $log(`Google Pro text::${_text}`)
            });

            resolve("Pronunciation revieved!");
        });
    });
}


function UTL_URL_WordFormat (_word)
{


    return _word;
}