const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

//# My Packages
const WordClass    = require('./Word_Class.js');
const StateMachine = require('./State_Machine.js');


$log = console.log;

//--- MAIN ---------------------------------------------

//-Http Requests
//let dictionaryURL = 'https://en.wiktionary.org/wiki/';
let dictionaryURL = 'https://www.dictionary.com/browse/';
let thesaurus_URL = 'https://www.thesaurus.com/browse/';
let wordURL       = 'lexicon';
//let wordURL       = 'edible';
//let wordURL         = 'wolf';
//let wordURL         = 'regular';
//let wordURL         = 'music';
let url = dictionaryURL + wordURL;


//-Instantiate a new Word class & assign the current word
var WORD = new WordClass.Word();
WORD.Word = wordURL;

//-StateMachine
var STATE = new StateMachine.State_Machine();
STATE.Set("SETUP");


// ----- MAIN LOOP ----- //
var mainLoop = setInterval( () =>
{

    if( STATE.Is("SETUP") ) //------------------->>>>>
    {
        STATE.Set("DICTIONARY");
    }
    if( STATE.Is("DICTIONARY") ) //-------------->>>>>
    {
        STATE.Process();
        //
        Scrape_Dictionary().then( (data) =>
        {
            $log(`--> Dictionary output::${data}`);
            STATE.Set("THESAURUS");
        });
    }
    if( STATE.Is("THESAURUS") ) //--------------->>>>>
    {
        STATE.Process();
        //        
        Scrape_Thesaurus().then( (data) => 
        {

            $log(`--> Scrape Thesaurus output::${data}`);
            clearInterval(mainLoop)
        })


    }


}, 500);


/**
 * Scrape from Dictionary.com
 */
function Scrape_Dictionary() {
    return new Promise((resolve, reject) => {

        //-Set the URL
        let Dictionary_URL = dictionaryURL + wordURL;


        axios.get(Dictionary_URL).then((response) => {

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

            // --- PRONUNCIATION ---
            let headWord = $('section .entry-headword').html();
            LEX_Parse_Pronunciation(headWord);


            // --- DEFINITIONS ---
            //-Get the ordered list of Definitions
            let definitions = $('section').html();
            LEX_Parse_Definitions(definitions);


            // --- ORIGIN OF ---
            // ? maybe
            resolve("Dictionary scraped!");

        });

    });
}

/**
 * Scrape from Thesaurus.com
 */
function Scrape_Thesaurus() {
    return new Promise((resolve, reject) => {

        //-Set the URL
        let Thesaurus_URL = thesaurus_URL + wordURL;

        $log("____________________Scraping Thesaurus___________________");

        axios.get(Thesaurus_URL).then((response) => {
            //-DEBUG
            $log(`Response::${response.status} | Response URL:: ${url}`);

            //-Cheerio the data
            const $ = cheerio.load(response.data);

            let divSection;
            // --- SECTIONS ---
            // Synonym & Antonym class: .css-ajupon
            $('div .css-ajupon').each((i, e) => {
                let section = $(e).text();
                $log(section);
                // --- SYNONYMS ---
                if (section.toLowerCase().startsWith('synonym')) {
                    divSection = $(e).parent().html();
                    LEX_Parse_Synonyms(divSection);
                }
                // --- ANTONYM ---
                if (section.toLowerCase().startsWith('antonym')) {
                    divSection = $(e).parent().html();
                    LEX_Parse_Antonyms(divSection);
                }
                else
                {
                    $log("--->> No Antonyms found! <<<---");
                }
            });

            // --- GET EXAMPLE WORD USAGES ---
            let examples_section = $('.collapsible-content').html();
            LEX_Parse_Examples(examples_section);


            resolve("Thesaurus Scraped!");

        }).catch( (error) =>
        {



        });
    });
}

/**
 * DICTIONARY.COM PARSING METHODS
 */

 /**
  * Parse the word's defintions
  * @param {HTML Object} _definitions Section object
  */
function LEX_Parse_Definitions (_definitions)
{
    //-Definiiton class
    let definitonClass = 'css-pnw38j';

    //-Load via Cheerio
    let $ = cheerio.load( _definitions );

    $log('___DEFINITIONS HTML___');
    //$log($.html())

    $('section').each( (i,e) => 
    {
        if( $(e).hasClass(definitonClass) )
        {
            
            let defintion = cheerio.load( $(e).html() );

            //*NOTE: Dictionary.com has another definition's section (The British section),
            // which doesn't use the .luna-pos tag.
            //-So add a condition: if the .luna-pos tag can't be found, skip this section!
            let _wordClass = defintion('.luna-pos').text();
            let wordClassFound = (_wordClass.trim()=='') ? false : true;
            $log(`!!Word Class found::${wordClassFound}`);
            //wordClassFound=true; //<--testing
        if( wordClassFound==true )
        {
            // Definition collection's word class/gramatical category
            let definition_wordClass = defintion('.luna-pos').text().replace(',', '');
            $log(`->Word Class::${definition_wordClass}` );

            let grammatical_category = defintion('.luna-grammatical-category').text();
            $log(`->Grammatical Category::${grammatical_category}` );

            let inflected_forms = [];
            defintion('.luna-inflected-form').each( (i,e) =>
            {
                let _if = $(e).text().replace(/·/g, '-');
                inflected_forms.push( _if );
            });
            $log(`->Inflected Form/s::${ inflected_forms }` );
            
            let inflected_pron = [];
            defintion('.pron-spell').each( (i,e) =>
            {
                let _if_p = $(e).text();
                inflected_pron.push( _if_p );
            });
            $log(`->Inflected Pronunciation/s::${inflected_pron}` );

            //+++ Assign to global variable
            INFLECTED_FORMS = [];
            for(let i=0; i<inflected_forms.length; i++)
            {
                // CREATE INFLECTED FORM //////////////////////
                let IF = new WordClass.Inflected_Form();
                IF.Grammatical_Category = grammatical_category;
                IF.Form = inflected_forms[i];
                if( inflected_pron[i] != undefined ) 
                    IF.Pronunciation = inflected_pron[i];
                //-Push
                INFLECTED_FORMS.push( IF );
            }

            // SAVE NEW DEFINITION BLOCK /////////////////////////
            DEF_BLOCK = new WordClass.Definition_Block();
            DEF_BLOCK.Grammatical_Category = definition_wordClass;
            DEF_BLOCK.Inflected_Forms = INFLECTED_FORMS;
            
            
            //-Iterate through 'div' elements with a 'value' attribute
            defintion('div[value]').each( (i, e) =>
            {
                let defNo = $(e).attr('value');
                if( defNo != undefined )
                {
                    // NEW DEFINITION //////////////////////////
                    let DEFINITION = new WordClass.Definition();
                    let contextualFound  = false;
                    let definition  = $(e).text();
                    let example     = '';

                    //-Cheerio the definition to search for elements
                    let def = cheerio.load( $(e).html() );
                    
                    //-Contextual definitions-----------------------------||
                    let contextual_Definition = def('.luna-label').html(); //$log(`Context::${contextual_Definition}`)
                    if( contextual_Definition!=null ) 
                    {
                        contextual_Definition = def('.luna-label').parent().text();
                        $log(`->Context ${defNo}::${contextual_Definition}`)
                        contextualFound = true;

                        //-Multiple definitions determined by 'li'
                        let multipleDefinitions = def('li').html();
                        if( multipleDefinitions!=null ) 
                        {
                            definition = [];
                            example    = [];
                            def('li').each( (index, sDef) => 
                            {
                                let d = $(sDef).text();
                                definition.push( d.toString() );
                                //
                                let _example = cheerio.load( sDef );
                                _example = _example('.luna-example').text();
                                if( _example!=null ) example.push( _example );
                                //
                                $log(`->Contextual Subdefinition ${defNo}::${d}`);
                                $log(`->Contextual Subdefinition Example ${defNo}::${_example}`);
                            });
                        }

                        //-Singular definition
                        if( multipleDefinitions==null ) 
                        {
                            definition = $(e).text().split('.')[1];
                            $log(`->Contextual definition ${defNo}::${definition}`);
                            //-Check for example
                            example = def('.luna-example').text();
                            if( example!='' )
                                $log(`->Contextual definition example ${defNo}::${example}`);     
                        }
                    }

                    //-Check for non-contextual definition with EXAMPLE--------------------||
                    if (contextualFound == false) 
                    {
                        example = def('.luna-example').text();
                        if (example != '') {
                            definition = def('.luna-example').parent().text().split(':')[0];
                            // Split example if necessary
                            example = example.split(';');

                            $log(`Example-Def ${defNo}::${definition}`)
                            $log(`Example ${defNo}::${example}`)
                        }
                    }

                    //-Regular definition
                    $log(`>>Definition ${defNo}::${ definition }` );

                    // +Assign to Global Object ////////////////////////////////////////
                    DEFINITION.Context = contextual_Definition;
                    DEFINITION.Definitions = DEFINITION.Definitions.concat( definition );
                    DEFINITION.Examples = DEFINITION.Examples.concat( example );

                    // Push this definition to the block ////
                    DEF_BLOCK.Definitions.push( DEFINITION );
                }
            });

            // DEBUG
            $log(`\nSection Index::${i}`);

            // +Add Definition to global WORD obj. //
            WORD.Definition_Blocks.push( DEF_BLOCK );

            console.table( WORD.Definition_Blocks )
        }

    }//|END - Check if we've found a 'word-class' e.g. noun!
    });

}

/**
 * Parse the pronunciation for the word!
 * @param {string} _pronunciation Parsed string...may be empty!
 */
function LEX_Parse_Pronunciation (_pronunciation)
{
    //-Load via Cheerio
    let $ = cheerio.load( _pronunciation );

    // $log('___PRONUNCIATION HTML___');
    // $log($.html())

    let pronunciation = $('.pron-spell-content').text();
    $log(`>>Pronunciation::${ pronunciation }` );

}


/**
 * THESAURUS.COM PARSING METHODS
 */

/**
 * Pull example sentances/usages of the word in question.
 * @param {Object} _exampleSection HTML Object containing examples
 */
function LEX_Parse_Examples( _exampleSection )
{
    //-Cheerio the html parameter
    let $ = cheerio.load( _exampleSection );
    $log('___EXAMPLES HTML___');

    $('p').each( (i,e) =>
    {
        let example = $(e).text();
        $log(`Example::${example}`);
    });
}

/**
 * Scrape antonyms from Thesaurus.com
 * @param {Object} _sections HTML Object to be Cheerio'd
 */
function LEX_Parse_Antonyms( _sections )
{

    //-Cheerio the html parameter
    let $ = cheerio.load( _sections );
    $log('___ANTONYMS HTML___');

    //-Vars to capture the synonym's relevance to the word
    let classAsDivision = '';
    let relevance = 1;

    //-Iterate over each list-item
    $('li').each( (i, e) => 
    {
        let antonym = $(e).text().trim();

        //-Get the antonym's class
        let antonym_class = $(e).children().children().attr('class');
        //Setup
        if( classAsDivision=='' ) classAsDivision = antonym_class;
        else
        {
            // Compare the classes on each word, and if they don't match, this indicates
            // the antonym's relevance has moved another increment away.
            if( antonym_class!=classAsDivision )
            {
                relevance++;
                classAsDivision = antonym_class;
            }
        }

        $log(`Antonym::${antonym} - Relevance::${relevance}`);
    });
}

/**
 * Scrape synonyms from Thesaurus.com
 * @param {Object} _sections HTML Object to be Cheerio'd
 */
function LEX_Parse_Synonyms( _sections )
{
    //-Cheerio the html parameter
    let $ = cheerio.load( _sections );
    $log('___SYNONYMS HTML___');

    //-Vars to capture the synonym's relevance to the word
    let classAsDivision = '';
    let relevance = 1;

    //-Iterate over each list-item
    $('li').each( (i, e) => 
    {
        let synonym = $(e).text().trim();

        //-Get the synonym's class
        let synonym_class = $(e).children().children().attr('class');
        //Setup
        if( classAsDivision=='' ) classAsDivision = synonym_class;
        else
        {
            // Compare the classes on each word, and if they don't match, this indicates
            // the synonym's relevance has moved another increment away.
            if( synonym_class!=classAsDivision )
            {
                relevance++;
                classAsDivision = synonym_class;
            }
        }

        // ADD TO GLOBAL WORD OBJ ////////
        SYNONYM = new WordClass.Synonym();
        SYNONYM.Synonym   = synonym;
        SYNONYM.Relevance = relevance;
        //
        WORD.Synonyms.push( SYNONYM );

        $log(`Synonym::${synonym} - Relevance::${relevance}`);
    });

}



