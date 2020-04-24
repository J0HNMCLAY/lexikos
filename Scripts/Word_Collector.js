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
//let wordURL       = 'lexicon';
let wordURL       = 'edible';
//let wordURL       = 'edible';
let url = dictionaryURL + wordURL;


//-Instantiate a new Word class & assign the current word
var WORD = new WordClass.Word();
WORD.Word = wordURL;


/**
 * Scrape from Dictionary.com
 */
axios.get( url ).then( (response) => 
{
    //-DEBUG
    $log(`Response::${response.status} | Response URL:: ${url}`);

    //-Cheerio the data
    const $ = cheerio.load(response.data);

    /**
     * Dictionary.com segments info. via the html <section> tag.
     * We build our word information by iterating through each section.
     * 
     * Below are bools we check off once we've retrived the data (dictionary.com)
     * sometimes has duplicate sections from US & British dictionarys!
     */
    let Pronunciations_Collected = false;
    let Definitions_Collected    = false;


    //-Start our sections
    let sections = $('section').length;
    for(let i=0; i<sections; i++)
    {
        //-Skip undefined vars/sections
        if( $('section')[i]==undefined ) continue;

        /*DEBUG*/ $log("---Start Pull---");

        //-Pull the class from each section
        let header = $('section')[i].attribs.class;
        //-Each definition block can be identified by the "entry-headword" class
        if( header.includes('entry-headword') )
        {
            //-Loads the header section including:
            // Word - Pronunciation - ***
            let headerChild = cheerio.load( $('section')[i] );

            // Pronunciation------------------------------------------||
            if( !Pronunciations_Collected )
            {
                let _pronunciation = headerChild('.pron-spell-content').text();
                Pronunciations_Collected = LEX_Parse_Pronunciation( _pronunciation );
            }


            // DEFINITIONS ------------------------------------------>>>>>>>>
            let Getting_Definintions = true;
            while( Getting_Definintions && !Definitions_Collected )
            {
                
                // Loads the next section...
                let nextSection = cheerio.load( $('section')[i] );

                //-If the next section is the "Origin of "//////
                // then we're finished collecting definitions///
                let originOf_check =  nextSection('h2').text();
                $log(`Origin of check::${originOf_check}`);
                if( originOf_check.startsWith("Origin of ") ) 
                {

                    //-Here we can start pulling extra info. Etymology etc.

                    let _headers_E = nextSection('h2').each( (i, el) =>
                    {
                        $log('---H2s---');
                        $log( $(el).text() );

                        let _headerText = $(el).text().toLowerCase();

                        //-Origin of...
                        if( _headerText.startsWith('origin of '))
                        {
                            let _wordOrigin = $(el).next().text();
                            LEX_Parse_WordOrigin( _wordOrigin );
                            //*use .html() to parse the word-origin with more precision!
                        }

                        //-Synonyms for...(brief list)
                        if( _headerText.startsWith('synonyms') )
                        {
                            let _synonyms = $(el).next().text();
                            $log(`Synonyms::${_synonyms}`);
                            //LEX_Parse_WordOrigin( _wordOrigin );
                        }



                    })


                    //-Finish up Definitions!
                    Getting_Definintions = false;
                    Definitions_Collected = true;
                    break;
                }
                ////////////////////////////////////////////////


                //-Setup new definition
                var WORD_CLASS = new WordClass.Word_Class();

                //-Get the word class *parse it!
                let _wordClass = nextSection('.luna-pos').html();
                WORD_CLASS.Word_Class = _wordClass;
                /*DEBUG*/ $log(`Word-class::${WORD_CLASS.Word_Class}`);

                //-Grammatical category/form (e.g. plural) *optional
                let _grammaticalCategory = nextSection('.luna-grammatical-category').html();
                WORD_CLASS.Grammatical_Category = _grammaticalCategory;
                /*DEBUG*/ $log(`Grammatical Category::${WORD_CLASS.Grammatical_Category}`);


                //-Inflected forms *optional
                //-Use the parent().children() pattern to grab forms in order
                let _inflectedElements = nextSection('.luna-inflected-form').parent().children();
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

                        //+++Add Inflected to Definition
                        WORD_CLASS.Inflected_Forms.push( INFLECTED_FORM );
                    }

                }

                // --- DEFINITIONS ---
                //-Get the ordered list of Definitions
                let _definitions = nextSection('div').children('div');
                $log(`Definition Elements::${_definitions.length}`);

                for (let i = 0; i < _definitions.length; i++) 
                {

                    // DEFINITION with EXAMPLE
                    let _exampledDefinition_E = $( _definitions[i] ).find('.luna-example');
                    if( _exampledDefinition_E.length )
                    {
                        let _exampleText = _exampledDefinition_E.text();

                        let _exampleDefinition = $( _exampledDefinition_E ).parent().text().split(':')[0];
                        $log(`>Example Definition::${ _exampleDefinition }`);
                        $log(`>Example Text::${ _exampleText }`);

                        //-Setup Definition Object
                        var DEFINTION = new WordClass.Definition();
                        DEFINTION.Definitions.push( _exampleDefinition.toString() );
                        DEFINTION.Example.push( _exampleText.toString() );
                        //+++Add to our WordClass Object
                        WORD_CLASS.Definition.push( DEFINTION );
                        continue;
                    }

                    // CONTEXTUAL DEFINITIONS
                    let _contextualDefinition_E = $( _definitions[i] ).find('.luna-label');
                    let _contextualDefinition = _contextualDefinition_E.text();
                    if( _contextualDefinition!='' )
                    {
                        var DEFINTION = new WordClass.Definition();
                        DEFINTION.Context = _contextualDefinition.toString();

                        //-Get contentual definitions
                        let _cDefinitions = $( _definitions[i] ).find('ol').text().split('.');
                            $log(`>Contextual Definition Header::${ DEFINTION.Context }`);
                        _cDefinitions.forEach((cd) => {
                            if( cd.trim()!='' ) {
                                DEFINTION.Definitions.push( cd.toString() );
                                $log(`>Contextual Definitions::${cd}`);
                            }
                        });

                        //+++Add to our WordClass Object
                        WORD_CLASS.Definition.push( DEFINTION );
                        continue;
                    }
                    
                    // REGULAR DEFINITION
                    let _Definition = $( _definitions[i] ).text();
                    $log(`>Regular Definition::${ _Definition }`);

                    //-Setup Definition Object
                    var DEFINTION = new WordClass.Definition();
                    DEFINTION.Definitions.push( _Definition.toString() );
                    //+++Add to our WordClass Object
                    WORD_CLASS.Definition.push( DEFINTION );
                    continue;
                }

                //+++Add WORD_CLASS
                WORD.Definitions.push( WORD_CLASS );

            }
        }
    }



    //$log(`No of sections::${sections}`);
    //console.table(WORD)

    return;

});

/**
 * DICTIONARY.COM PARSING METHODS
 */

/**
 * Parse the pronunciation for the word!
 * @param {string} _pronunciation Parsed string...may be empty!
 */
function LEX_Parse_Pronunciation (_pronunciation)
{
    let collected = false;

    if (_pronunciation != '') 
    {
        WORD.Pronunciation = _pronunciation;
        collected=true;

        /*DEBUG*/ 
        $log("Pronunciation..." + WORD.Pronunciation)
    }

    if(!collected ) $log(` :( -> Pronunciation for ${WORD.Capitalised()} not found... `);

    return collected;
}


function LEX_Parse_WordOrigin (_origin)
{
    _origin = _origin.split(';');
    let period = _origin[0];
    let origin = _origin[1].trim();

        //DEBUG
        $log(` > Origin - Period::${period}`);
        $log(` > Origin - Origin::${origin}`);

    //-Set WORD Object
    WORD.Etymology = new WordClass.Etymology();
    WORD.Etymology.Origin_Period = period;
    WORD.Etymology.Origin = origin;

}


function LEX_Parse_Synonyms (_synonyms)
{
    //-Brief parse...

    //-Set WORD Object
    WORD.Synonyms = new WordClass.Synonyms();
    WORD.Synonyms.BriefList.push( _synonyms );
}



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



