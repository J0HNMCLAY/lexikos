const FS = require("fs");

const axios   = require('axios').default;
const cheerio = require('cheerio');

//# My Packages
const WordClass = require('./Word_Class.js');

$log = console.log;

//--- MAIN ---------------------------------------------

//-Http Requests
//let dictionaryURL = 'https://en.wiktionary.org/wiki/';
let thesaurus_URL = 'https://www.thesaurus.com/browse/';
//let wordURL       = 'lexicon';
let wordURL       = 'edible';
//let wordURL         = 'wolf';
//let wordURL         = 'regular';
//let wordURL         = 'music';
let url = thesaurus_URL + wordURL;


//-Instantiate a new Word class & assign the current word
var WORD = new WordClass.Word();
WORD.Word = wordURL;

/**
 * Scrape from Thesaurus.com
 */
axios.get( url ).then( (response) => 
{
    //-DEBUG
    $log(`Response::${response.status} | Response URL:: ${url}`);

    //-Cheerio the data
    const $ = cheerio.load(response.data);

    let divSection;
    // --- SECTIONS ---
    // Synonym & Antonym class: .css-ajupon
    $('div .css-ajupon').each( (i,e) =>
    {
        let section = $(e).text();
        $log( section );
        // --- SYNONYMS ---
        if( section.toLowerCase().startsWith('synonym') )
        {
            divSection = $(e).parent().html();
            LEX_Parse_Synonyms( divSection );
        }
        // --- ANTONYM ---
        if( section.toLowerCase().startsWith('antonym') )
        {
            divSection = $(e).parent().html();
            LEX_Parse_Antonyms( divSection );
        }
    });

    // --- GET EXAMPLE WORD USAGES ---
    let examples_section = $('.collapsible-content').html();
    LEX_Parse_Examples( examples_section );

});


/**
 * THESAURUS.COM PARSING METHODS
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

        //$log(`Antonym::${antonym} - Relevance::${relevance}`);
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

        $log(`Synonym::${synonym} - Relevance::${relevance}`);
    });

}

