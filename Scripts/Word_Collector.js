const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

//# My Packages
const WordClass = require('./Word_Class.js');

$log = console.log;

//--- MAIN ---

//-Http Requests
//let dictionaryURL = 'https://en.wiktionary.org/wiki/';
let dictionaryURL = 'https://www.dictionary.com/browse/';
let wordURL       = 'lexicon';
//let wordURL       = 'edible';
let url = dictionaryURL + wordURL;

//
var WORD = new WordClass.Word();
WORD.Word = wordURL;

//-Pull data ***Turn into Class!
let word          = '';
let pronunciation = '';
let wordClass     = '';
let grammatical_category = '';
let inflected_forms = [];


axios.get( url ).then( (response) => 
{
    //-DEBUG
    $log(`Response::${response.status} | Response URL:: ${url}`);

    //-Cheerio the data
    const $ = cheerio.load(response.data);

    /**
     * Dictionary.com segments info. via the html <section> tag.
     * We build our word information by iterating through each section.
     */
    let sections = $('section').length;
    for(let i=0; i<sections; i++)
    {
        //-Skip undefined vars/sections
        if( $('section')[i]==undefined ) continue;


        if( i > 4 ) continue; //DEBUG
        /*DEBUG*/ $log("---Start Pull---");

        //-Pull the class from each section
        let header = $('section')[i].attribs.class;
        //-Each definition uses the "entry-headword" class!
        if( header.includes('entry-headword') )
        {
            //-Loads the header section including:
            // Word - Pronunciation - ***
            let headerChild = cheerio.load( $('section')[i] );

            // Pronunciation------------------------------------------||
            let _pronunciation = headerChild('.pron-spell-content').text();
            if (_pronunciation != '') 
                WORD.Pronunciation = _pronunciation;

            /*DEBUG*/ $log("Pronunciation..." + WORD.Pronunciation)
            // Pronunciation------------------------------------------||


            // DEFINITIONS ------------------------------------------>>>>>>>>
            for( let a=0; a<2; a++ )
            {

                // Loads the next section...
                let nextElement = cheerio.load( $('section')[i] );

                //**check if it exists... ***/

                //-Setup new definition
                var DEFINITION = new WordClass.Definition();


                //-Get the word class *parse it!
                let _wordClass = nextElement('.luna-pos').html();
                DEFINITION.Word_Class = _wordClass;
                /*DEBUG*/ $log(`Word-class::${DEFINITION.Word_Class}`);

                //-Grammatical category/form (e.g. plural) *optional
                let _grammaticalCategory = nextElement('.luna-grammatical-category').html();
                DEFINITION.Grammatical_Category = _grammaticalCategory;
                /*DEBUG*/ $log(`Grammatical Category::${DEFINITION.Grammatical_Category}`);


                //-Inflected forms *optional
                //-Use the parent().children() pattern to grab forms in order
                let _inflectedElements = nextElement('.luna-inflected-form').parent().children();
                /*DEBUG*/ //$log(`Inflected Form LEN::${_inflectedElements}`);

                for(let i=0; i<_inflectedElements.length; i++)
                {
                    //-Get the inflected form
                    if( _inflectedElements[i].attribs.class=='luna-inflected-form' )
                    {
                        // SETUP
                        var INFLECTED_FORM = new WordClass.Inflected_Form();

                        let _inflectedForm = $(_inflectedElements[i]).text();
                        INFLECTED_FORM.Form = _inflectedForm;
                        $log(`Inflected form text-->${INFLECTED_FORM.Form}`);

                        //- Check for pronunciation of the inflected form...
                        if( (i+1)==_inflectedElements.length ) 
                            continue; //<--Skip if no element present
                        let nextClass = _inflectedElements[i+1].attribs.class;
                        if( nextClass=='luna-pronset' )
                        {
                            let _ifPronunciation = $(_inflectedElements[i+1]).children('.pron-spell').text();
                            INFLECTED_FORM.Pronunciation = _ifPronunciation;
                            $log(`*InflectedForm Pronunciation::${INFLECTED_FORM.Pronunciation}`);

                        }

                        //-Add Inflected to Definition
                        DEFINITION.Inflected_Forms.push( INFLECTED_FORM );
                    }

                }

                //-Get the ordered list of Definitions
                let _definitions = nextElement('div').children();
                //_definitions = _definitions.split('.');

                for (let i = 0; i < _definitions.length; i++) 
                {
                    let def = _definitions[i].attribs.value
                    //DEFINITION.Definition.push
                    $log(`Definitions::[${i}]${  $(_definitions[i]).text()  } || value-${def}`);
                }

            }

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



