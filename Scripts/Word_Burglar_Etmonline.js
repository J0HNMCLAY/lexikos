const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

var $log = console.log;

//-URL---------------------------------------------------
const dictionaryURL = 'https://www.etymonline.com/word/';
class URL_LETTER {
    constructor () {
        this.Letter = 'a';
        this.Number = 0;
        this.Last   = NaN;
        //
        this.index  = 0;
        this.Alphabet = 'abcdefghijklmnopqrstuvwxyz0';
    }
    Set = (_letter, _number) => 
    { 
        this.Letter = _letter || NaN;
        this.Number = _number || NaN; 
    }
    Get = () => 
    { 
        let suffix = this.Letter + '/';
        if( this.Number >= 1 ) suffix += this.Number.toString();
        return suffix;
    }
    Update = () =>
    {
        this.Number++; 
        if( this.Number > this.Last && !isNaN(this.Last) ) { 
            this.index++; 
            this.Letter = this.Alphabet[this.index];
            this.Number=0; console.log("Update Letter!");
        }
    }
}
URL_suffix = new URL_LETTER();

//-Files-------------------
let DIRECTORY = './_w_Etymonline/';
let readFile  = '';
let writeFile = '';

//-State Machine------------
class StateMachine {
    constructor(_initial_state)
    {
        this.State = _initial_state || '';
        this.Loop  = 0;
        this.Total_Loops = 50000;
    }
    Set = (_state) => { this.State = _state.toUpperCase(); $log(`State Update::${this.State}`); }
    Is  = (_state) => { if(this.State==_state) return true; return false; }
    Process  = ()  => { this.State="PROCESSING"; }
    Finished = ()  => { if(this.Loop>=this.Total_Loops) return true; return false; }
}
var STATE = new StateMachine('SETUP');


// DATA------------------
var __cheerio_data;
var __word_list = [];
var __pageNo;

// WORDS [Editable]--------------
const firstWord = 'aardvark';
const lastWord  = 'zyzzyva';
const testWord  = 'ham fisted';

var __TESTWORD = false;

//-OVERRIDES----------------------
var __READ_STATS = false;


/**
 * ---------- MAIN LOOP ---------- *
 */                                
let mainLoop = setInterval( () =>
{
    // Override ///////////////////
    if( __READ_STATS )
    {
        STATE.Process();
        Get_Dictionary_Stats();
        clearInterval(mainLoop);
    }
    //////////////////////////////

    if( STATE.Is("SETUP") || STATE.Is("GET_WORD") ) //------>>>>>
    {
        STATE.Process();
        //
        Get_Words().then( (pageData) =>
        {
            STATE.Set("PARSE_WORDS");
            __cheerio_data = pageData;

            // DEBUG ////////////////////////
            STATE.Loop++;
            $log(`State Loop::${STATE.Loop}`);
        });
    }
    if( STATE.Is("PARSE_WORDS") ) //------------------------>>>>>
    {
        STATE.Process();
        //
        Parse_Page_ForWords(__cheerio_data).then( (data) =>
        {
            STATE.Set("SAVE_WORDS");
        });
    }
    if( STATE.Is("SAVE_WORDS") ) //------------------------->>>>>
    {
        Save_WordList( __word_list ).then( (data) =>
        {
            STATE.Set("GET_WORD");
        });
        //
        // if( STATE.Loop>10 ) STATE.Set("GET_WORD");
        // else
        //     STATE.Set("FINISHED");
    }

    if( STATE.Is("FINISHED") ) //--------------------------->>>>>
    {
        clearInterval(mainLoop)
    }

}, 500);



/**
 * Load the next available word to check!
 */
function Get_Words () {
    return new Promise((resolve, reject) => 
    {

        //-Setup URL Extra
        let url = dictionaryURL + *************

        //url = 'https://www.merriam-webster.com/browse/dictionary/a/1'; //<--test
        $log(`Axios URL::${url}`);

        //-Create an instance with a longer timeout...
        const myAxios = axios.create({ timeout: 10000 });

        // Web Request...
        myAxios.get(url).then((response) => 
        {
            const $c = cheerio.load(response.data);
            resolve($c.html());
            return;

        }).catch((error) => {

            $log(`Axios::${error}`);
            $log(`Error code::${error.response.status}`);

        });

    });
}

/**
 * Save words to our JSON dictionary!
 */
function Save_WordList(wordList) {
    return new Promise((resolve, reject) => 
    {

        //-Turn singular object into an array
        if (wordList.length == undefined) wordList = new Array(wordList);

        //-Get the initial letter
        let wordFile = URL_suffix.Letter.toUpperCase() + '.json';
        wordFile = DIRECTORY + wordFile;

        //-Check if file exists
        let fileExists = FS.existsSync(wordFile);

        if (fileExists) 
        {
            //-Retrieve and parse existing words into 
            let fileContent = FS.readFileSync(wordFile);
            fileContent = JSON.parse(fileContent);

                //LOG
                $log(`File [${wordFile}] | Length::${fileContent.length}`)

            //-Add our new words!
            fileContent = fileContent.concat(wordList);
            
            //-Stringify our words
            fileContent = JSON.stringify(fileContent);
            //-Write our words
            FS.writeFileSync(wordFile, fileContent);
        }
        else 
        {
            //-Stringify our array of words!
            fileContent = JSON.stringify( wordList );
            // - Write File
            FS.writeFileSync(wordFile, fileContent);

            // LOG
            $log(`New word file written::${wordFile} !`);
        }

        resolve();
        return;

    });

}


function Parse_Page_ForWords(wordHTML) {
    return new Promise((resolve, reject) => {

        //-Reset our main list
        __word_list = [];

        //-Cheerio word
        const $ = cheerio.load(wordHTML);

        //-Get the page numbers
        let pages = $('.counters').text().trim();
        pages = pages.substring( pages.length-2, pages.length );

        //-Set Page no.
        URL_suffix.Last = pages;
        $log(`Total pages::${pages} for Letter::${URL_suffix.Letter}` );

        //-Get words from HTML
        let wordsHTML = $('div .entries').html();
        let words = cheerio.load(wordsHTML);
        words('a').each( (i,e) =>
        {
            let word = $(e).text().trim();
            __word_list.push( word );
            // DEBUG ////////////////////
            //$log(`Word::${$(e).text()}`);
        });

        //$log( __word_list );
        resolve();
    });
}

/**
 * Returns overall stats from teh collected dictionary!
 */
function Get_Dictionary_Stats ()
{
    let files = 0;
    let words = 0;
    //
    let fileList = [];
    let directory = FS.readdirSync(DIRECTORY);
    directory.forEach((e) => 
    {
        if (e.endsWith('.json')) {
            fileList.push(e.toString())
            files++;
        }
    });
    fileList.forEach( (e) => 
    {
        let fileData = FS.readFileSync(DIRECTORY + e);
        let wordData = JSON.parse(fileData);
        //
        wordData.forEach( (e) => { words++; });
    });

    $log(`!! Dictionary Stats - Files::${files} | Words::${words}`);

}

/**
 * Formats the current word into a URL friendly string
 * e.g. Dictionary.com requires '-' (dashes) between words in the URL
 * e.g. thefreedictionary.com requires '+' (positive sign) between words in the URL
 * @param {string} _rawWord The word or phrase in question
 */
function URL_Formatted_Word(_rawWord)
{
    //-Format each non-character into a '+' so the word 
    // is accepted in a URL
    let word = _rawWord.replace(/[^a-zA-Z]/g, "+");
    return word;
}

/**
 * Assign the first word to begin! (Convenience function)
 */
function Get_First_Word () 
{
    ACTIVE_WORD = new WORD(firstWord);
    return ACTIVE_WORD;
}

/**
 * Assign a test word to debug the code
 */
function Get_Test_Word () 
{
    ACTIVE_WORD = new WORD( testWord );
    return ACTIVE_WORD;
}