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
//let wordURL         = 'wolf';
//let wordURL         = 'regular';
//let wordURL         = 'music';
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

    // --- PRONUNCIATION ---
    let headWord = $('section .entry-headword').html();
    LEX_Parse_Pronunciation( headWord );


    // --- DEFINITIONS ---
    //-Get the ordered list of Definitions
    let definitions = $('section').html();
    LEX_Parse_Definitions( definitions );


    // --- ORIGIN OF ---
    
    return

});

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

            let wordClass = defintion('.luna-pos').text()
            $log(`->Word Class::${wordClass}` );

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
                let IF = new WordClass.Inflected_Form();
                IF.Form = inflected_forms[i];
                if( inflected_pron[i] != undefined ) IF.Pronunciation = inflected_pron[i];
                INFLECTED_FORMS.push( IF );
            }

            WORD_CLASS = new WordClass.Word_Class();
            WORD_CLASS.Word_Class = wordClass;
            WORD_CLASS.Grammatical_Category = grammatical_category;
            WORD_CLASS.Inflected_Forms = INFLECTED_FORMS;
            
            
            //-Iterate through 'div' elements with a 'value' attribute
            defintion('div[value]').each( (i, e) =>
            {
                let defNo = $(e).attr('value');
                if( defNo != undefined )
                {
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

                    //+++Assign to Global Object
                    DEFINITION.Context = contextual_Definition;
                    DEFINITION.Definitions = DEFINITION.Definitions.concat( definition );
                    DEFINITION.Examples = DEFINITION.Examples.concat( example );


                    WORD_CLASS.Definition.push( DEFINITION );
                }
            });

            // DEBUG
            $log(`\nSection Index::${i}`);

            //+++Add Definition to global WORD obj.
            WORD.Definitions.push( WORD_CLASS );

            console.table( WORD.Definitions )
        }
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

/**
 * 
 * @param {Object} _synonyms HTML Element containing synonyms
 */
function LEX_Parse_Synonyms (_synonyms)
{

    //-Prime Synonym array
    let Synonyms = [];


    //-Load via Cheerio
    let $ = cheerio.load( _synonyms );
    //-Break into its HTML 
    let _synonyms_E = $( _synonyms ).html();
    //-Iterate over each element
    $( _synonyms_E ).each( (i, el) =>
    {
        let text = '';
        if( $(el).hasClass('luna-xref') ) { //<-- class identified as actually containing synonyms
            text = $(el).text();
            Synonyms.push( text.toString() );
            //$log(`Synonym::${text}`);
        }
    });

    //-Set WORD Object
    WORD.Synonyms = new WordClass.Synonyms();
    WORD.Synonyms.BriefList = Synonyms.concat( WORD.Synonyms.BriefList );

    // DEBUG
    $log(`Synonyms [Brief List]::${WORD.Synonyms.BriefList}`);
}


function LEX_Parse_OtherWordsFrom (_otherWords)
{

    let Related_Forms = [];

        //-Load via Cheerio
        let $ = cheerio.load( _otherWords );
        //-Break into its HTML 
        let _otherWords_E = $( _otherWords ).html();
        //-Iterate over each element
        $( _otherWords_E ).each( (i, el) =>
        {
            let _subElements = $(el).html();
            $( _subElements ).each( (i, subE) => 
            {
                let text = ''
                if( $(subE).hasClass('luna-runon') ) {
                    text = $(subE).text().replace(/·/g, '');
                    Related_Forms.push( text );
                    //$log(`Related F::${text}`);
                }
            });

        });


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



