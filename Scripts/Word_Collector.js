const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

$log = console.log;

//--- MAIN ---

//-Http Requests
//let dictionaryURL = 'https://en.wiktionary.org/wiki/';
let dictionaryURL = 'https://www.dictionary.com/browse/';
//let wordURL       = 'lexicon';
let wordURL       = 'edible';
let url = dictionaryURL + wordURL;

axios.get( url ).then( (response) => 
{
    //-DEBUG
    $log(`Response::${response.status} | Response URL:: ${url}`);

    //-Pull data
    let word          = '';
    let pronunciation = '';
    let wordClass     = '';
    let grammatical_category = '';
    let inflected_forms = [];

    //-Cheerio the data
    const $ = cheerio.load(response.data);


    let sections = $('section').length;
    for(let i=0; i<sections; i++)
    {
        //-Skip undefined vars
        if( $('section')[i]==undefined ) continue;


        let header = $('section')[i].attribs.class;
        if( header.includes('entry-headword') )
        {
            // Pronunciation
            let headerChild = cheerio.load( $('section')[i] ); 
            let _pronunciation = headerChild('.pron-spell-content').text();
            if( _pronunciation!='' ) pronunciation = _pronunciation;
            // DEBUG
            $log("Getting pronunciation..." + pronunciation)

            // Word-class: Verb, Noun, Adj. etc.)
            let nextElement = cheerio.load( $('section')[i+1] );
            let _wordClass  = nextElement('.luna-pos').text();

            $log(`Word-class::${_wordClass}` );

        }
        // DEBUG
        //$log("Getting section classes..." + header)

    }



    $log(`No of sections::${sections}`);

    return;

    $('section').each((i,element) => 
    {
        let child = cheerio.load(element);

        //-Word Header
        // Entry point (parent element) to scrape variables
        let header = element.attribs.class;
        if( header.includes('entry-headword') )
        {
            // Pronunciation
            let headerChild = cheerio.load(element); 
            let _pronunciation = headerChild('.pron-spell-content').text();
            if( _pronunciation!='' ) pronunciation = _pronunciation;
            // DEBUG
            //$log("Getting header..." + pronunciation)

            // Word wordClassb, Noun, Adj. etc.)
            let wee = element.firstChild.name;
            //let nextElement = cheerio.load( element.nextSibling );
            //let _wordClass;//nextElement('.luna-pos').text();

            $log('Here')
            $log("Getting wordClass" + wee)
        }

        $log(`Index::${i} : Has header class:: ${header}`)

        //pronunciation = child('span').text();
        //let classes = child('span').text();
        //$log(`Index::${i} : ${classes}`)
    });

    // //-Word Pronunciation
    // $('.pron-spell-container').each((i,element) => 
    // {
    //     let child = cheerio.load(element);
    //     pronunciation = child('span').text();
    // });

    // //-wordClassn, Verb etc.)
    // $('.luna-pos').each((i,element) => 
    // {
    //     let child = cheerio.load(element);
    //     wordClassild('span').text();

    //     let parent = child('section').attr('class');
    //     $log(parent)

    // });

    // //-Grammatical category
    // $('.luna-grammatical-category').each((i,element) => 
    // {
    //     let child = cheerio.load(element);
    //     grammatical_category = child('span').text();
    // });

    // //-Inflected form
    // $('.luna-inflected-form').each((i,element) => 
    // {
    //     let child = cheerio.load(element);
    //     let inflected_form = child('span').text();
    //     inflected_forms.push( inflected_form );
    // });


    //-Debug Data________________________________________||
    $log(`Pronunciation::${pronunciation}`);
    $log(`Word Class::${wordClass}`);    
    $log(`Grammatical Category::${grammatical_category}`);
    $log(`Inflected forms::${inflected_forms}`);


  
}).catch( (err) => 
{
    $log(`Word Lookup Error::${err}`);
});




// Read_Words().then( () => 
// {
//     $log("Finished reading...");
// });

// function Read_Words ()
// {
//     return new Promise( (resolve, reject) =>
//     {
//         let dir = "./LeDictionary/";
//         let file= "words_alpha.txt";
//         //
//         let wordList = FS.readFileSync(dir+file);
//         $log(wordList.toString())
//         //$log(wordList[10])

//         resolve();
//         return;
//     });
// }



