const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

var $log = console.log;

//-URL---------------------------------------------------
const dictionaryURL = 'https://www.thefreedictionary.com/';


//-Files-------------------
let DIRECTORY = './Words_02/';
let readFile  = '';
let writeFile = '';

//-State Machine------------
class StateMachine {
    constructor()
    {
        this.State = 'SETUP';
        this.Loop  = 0;
        this.Total_Loops = 50000;
    }
    Set = (_state) => { this.State = _state.toUpperCase(); }
    Is  = (_state) => { if(this.State==_state) return true; return false; }
    Process  = ()  => { this.State="PROCESSING"; }
    Finished = ()  => { if(this.Loop>=this.Total_Loops) return true; return false; }
}
var STATE = new StateMachine();


//-Word as checkable entry----
class WORD {
    constructor(_word)
    {
        this.Word   = _word;
        this.Checked= false;
        this.Valid  = false;
        this.Msg    = '';
    }
    IsValid = (_msg) => 
    { 
        this.Checked=true; this.Valid=true; 
        this.Msg = _msg; 
    }
    Invalid = (_msg) =>
    {
        this.Checked=true;
        this.Msg = _msg;
    }
}
var ACTIVE_WORD = '';

// DATA------------------
var __cheerio_data;
var __word_list;

// WORDS [Editable]--------------
const firstWord = 'aardvark';
const lastWord  = 'zyzzyva';
const testWord  = 'ham fisted';

var __TESTWORD = false;


/**
 * ---------- MAIN LOOP ---------- *
 */                                
let mainLoop = setInterval( () =>
{

    if( STATE.Is("SETUP") || STATE.Is("GET_WORD") ) //------>>>>>
    {
        STATE.Process();
        //
        Load_Word().then( (word) =>
        {
            ACTIVE_WORD = word;
            STATE.Set("CHECK_WORD");
            // DEBUG
            STATE.Loop++;
            $log(`State Loop::${STATE.Loop}`);
        });
    }
    if( STATE.Is("CHECK_WORD") ) //------------------------>>>>>
    {
        STATE.Process();
        //
        Check_Word().then( (data) =>
        {
            __cheerio_data = data;
            STATE.Set("PARSE_WORD");

        }).catch( (error) =>
        {
            // !!Word not found!! \\
            if( error==404 ) 
            {
                Save_WordList( ACTIVE_WORD ).then((data)=>{  });
            }

        });
    }
    if( STATE.Is("PARSE_WORD") ) //------------------------>>>>>
    {   
        STATE.Process();
        //
        Parse_Word( __cheerio_data ).then( (data) =>
        {
            Save_WordList( __word_list ).then( (data) =>
            {


                STATE.Set("FINISHED");
            })

        }).catch((error) =>
        {
            $log(`Parse Word ERROR::${error}`);
            clearInterval(mainLoop)
        });

    }

    if( STATE.Is("FINISHED") )
    {
        clearInterval(mainLoop)
    }



}, 500);


/**
 * Save words to our JSON dictionary!
 */
function Save_WordList(wordList) {
    return new Promise((resolve, reject) => 
    {
        $log('Saving wordlist...');
        $log( wordList )
        resolve()
        return;

        //-Turn singular object into an array
        if (wordList.length == undefined) wordList = new Array(wordList);


        for (let i = 0; i < wordList.length; i++) 
        {
            //-Derive word file from the word's initial letter!
            let wordFile = ( wordList[i].Word[0].trim().toUpperCase() ) + '.json';
            wordFile = DIRECTORY + wordFile;

            //-Check if file exists
            let fileExists = FS.existsSync(wordFile);

            if (fileExists) 
            {
                let fileContent = FS.readFileSync(wordFile);
                fileContent = JSON.parse(fileContent);

                //-Replace existing words (prevents duplicates!)
                let _wordIndex = fileContent.findIndex((e) => { return e.Word == wordList[i].Word });
                if (_wordIndex != -1) {
                    //-If the word's has NOT been checked...add
                    if ( fileContent[_wordIndex].Checked==false )
                    {
                        fileContent[_wordIndex] = wordList[i];
                    }
                }
                else {
                    fileContent.push(wordList[i]);
                }

                fileContent = JSON.stringify(fileContent);
                //
                FS.writeFileSync(wordFile, fileContent);
            }
            else {
                let fileContent = [];
                fileContent.push(wordList[i]);
                fileContent = JSON.stringify(fileContent);
                //
                FS.writeFileSync(wordFile, fileContent);
                // LOG
                $log(`New word file written::${wordFile} !`);
            }
        }

        resolve();
        return;

    });

}

/**
 * Load the next available word to check!
 */
function Load_Word() {
    return new Promise((resolve, reject) => {

        //-Reset
        ACTIVE_WORD = null;

        if (__TESTWORD) //-TESTING
        {
            ACTIVE_WORD = Get_Test_Word();
            resolve(ACTIVE_WORD);
            return;
        }

        //Check Directory
        let files = [];
        let directory = FS.readdirSync(DIRECTORY);
        directory.forEach((e) => 
        {
            if (e.endsWith('.json')) files.push(e.toString())
        });

        $log(`JSON Word Files::${files}`);

        //-If no file found...
        if (!files.length) ACTIVE_WORD = Get_First_Word();

        //-Go through files until we find a word that hasn't been checked!
        for (let i = 0; i < files.length; i++) 
        {
            //$log(`Looking through files::${ files[i] }`);
            let fileData = FS.readFileSync(DIRECTORY + files[i]);
            let wordData = JSON.parse(fileData);

            //-Iterate through words
            for (let j = 0; j < wordData.length; j++) 
            {
                if (wordData[j].Checked == false) 
                {
                    ACTIVE_WORD = new WORD(wordData[j].Word);
                    break;
                }
            }

            // Return if we have a word
            if (ACTIVE_WORD != null) break;
        }

        // DEBUG
        $log(`Get Word::${ACTIVE_WORD.Word}`);

        resolve(ACTIVE_WORD);
        return;
    });
}

//gentle witness want drip lake horn jazz daughter novel couch keen neglect

/**
 * Check if the word exists in the dictionary (as an actual word)
 */
function Check_Word() {
    return new Promise((resolve, reject) => {

        // Build our URL
        let word = URL_Formatted_Word( ACTIVE_WORD.Word );
        //let word = 'wooop' //<--TEST
        let url = dictionaryURL + word;

        $log(`Axios URL::${url}`);

        //-Create an instance with a longer timeout...
        const myAxios = axios.create({ timeout: 10000 });

        // Web Request...
        myAxios.get(url).then((response) => 
        {
            //-If successful: Cheerio the result into HTML and return
            const $ = cheerio.load(response.data);
            resolve($.html());
            return;

        }).catch((error) => {

            //-Not found!
            if( error.response.status==404 )
            {
                $log(`Axios - ${error}`);
                ACTIVE_WORD.Invalid("Word doesn't exist");
                reject(404)
                return;
            }

        });

    });
}

function Parse_Word(wordHTML) {
    return new Promise((resolve, reject) => {

        //-Cheerio word
        const $ = cheerio.load(wordHTML);

        $('div .CustHpBlock').each((i,e) =>
        {
            $log(`Elements ${i}::${ $(e).text() }`)
        });


        resolve();

    });

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