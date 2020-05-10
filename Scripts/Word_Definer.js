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
/**Macmilliandictonary.com */
let macmillian_URL= 'https://www.macmillandictionary.com/dictionary/british/';
/**Definitons.net */
let pronunce_URL  = 'https://www.definitions.net/definition/';
/**Definitons.net */
let syllables_URL = 'https://www.definitions.net/definition/';
let wordURL       = 'lexicon';
//let wordURL       = 'edible';
//let wordURL         = 'wolf';
//let wordURL         = 'regular';
//let wordURL         = 'music';
//let wordURL       = 'rush';
let url = dictionaryURL + wordURL;

//
let Thesaurus_PAGES = 1;


//-Instantiate a new Word class & assign the current word
var WORD = new WordClass.Word();
WORD.Word = wordURL;

//-StateMachine
var STATE = new StateMachine.State_Machine();
STATE.Setup();

//-Debug Controller
var DEBUG = new StateMachine.DebugController();


// ----- MAIN LOOP ----- ///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
var mainLoop = setInterval( () =>
{

    if( STATE.Is("SETUP") ) //------------------->>>>>
    {
        //STATE.Set("DICTIONARY");
        STATE.Set("ADDITIONAL_INFO");
    }
    if( STATE.Is("DICTIONARY") ) //-------------->>>>>
    {
        STATE.Process();
        //
        Scrape_Dictionary().then( (data) =>
        {
            $log(`--> Dictionary output::${data}`);
            STATE.Set("THESAURUS");
            //STATE.Finish();
        });
    }
    if( STATE.Is("THESAURUS") ) //--------------->>>>>
    {
        STATE.Process();
        //        
        Scrape_Thesaurus().then( (data) => 
        {
            $log(`--> Scrape Thesaurus output::${data}`);
            STATE.Set("ADDITIONAL_INFO");
            STATE.Finish();
        })
    }
    if( STATE.Is("ADDITIONAL_INFO") )
    {
        STATE.Process();
        //
        Scrape_Additional_Info().then( (data) =>
        {
            $log('----------- Additional Info. Scraped --------------')
            clearInterval(mainLoop)
        });
    }
    if( STATE.IS_FINISHED() ) //------------------>>>>>
    {
        $log(`Finishing..`);
        clearInterval(mainLoop);
    }

}, 500);


/**
 * Scrape from MacMillan Dictionary
 */
async function Scrape_Additional_Info () 
{

    // ---GET ADDITIONAL WORD FORMS--- \\
    await MMD_Parse_Word_Forms();

    // ---SYLLABIC FORM--- \\
    await ADL_Get_SyllabicForm().then( (_syllabicForm) =>
    {
        WORD.Syllabic_Form = _syllabicForm;
        // create syllables
        if( WORD.Syllabic_Form.includes('·') )
            WORD.Syllables = WORD.Syllabic_Form.split('·');

        // DEBUG
        if (DEBUG.Syllables) {
            $log(`->>Syllabic Form MAIN::${WORD.Syllabic_Form}`);
            $log(`->>Syllables::${WORD.Syllables}`);
        }
    });

    // ---GET WORD PRONUNCIATION--- \\
    await ADL_Get_Pronunciation().then( (pronunciation) =>
    {
        WORD.Pronunciation = pronunciation;
        if( DEBUG.Pronunation ) $log(`>>Pronuniation::${WORD.Pronunciation}`);
    })

    // ---ADDITIONAL FORMS SYLLABIC-FORM--- \\
    for(let i=0; i<WORD.Forms.length; i++) 
    {
        $log(`Loop::${i} | Form::${WORD.Forms[i].Form}`)
        //
        let _word = WORD.Forms[i].Form;
        await ADL_Get_SyllabicForm(_word).then( (_syllForm) => 
        {
            WORD.Forms[i].Syllabic_Form = _syllForm;
        });
    }

    // ---GET RELATED WORDS & THEIR SYNONYMS--- \\
    await ADL_GetRelatedWords_Synonyms().then( (data) =>
    {
        $log('>> FINISHED Related Words & Synonyms!')
    });

    $log('-->> LAST Part of Additional Info <<--');


    // for(var w in words) {
    //     await ADL_Get_SyllabicForm( words[w] );
    //     //
    //     $log(`Pronunciation step::${words[w]}`)
    // }

}

/**
 * Scrape from Dictionary.com
 */
function Scrape_Dictionary() {
    return new Promise((resolve, reject) => {

        //-Set the URL
        let Dictionary_URL = dictionaryURL + wordURL;

        //-Make the request...
        axios.get(Dictionary_URL).then((response) => {

            //-DEBUG
            $log(`Response::${response.status} | Response URL:: ${Dictionary_URL}`);

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

            // --- EXAMPLES ---
            let examples = $('#examples-section').html();
            LEX_Parse_Dictionary_Examples( examples );

            // --- DERIVATIONS ---
            let otherForms = $('div').html();
            LEX_Parse_Derivations( otherForms );

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
            // DEBUG
            $log(`Response::${response.status} | Response URL:: ${Thesaurus_URL}`);

            //-Cheerio the data
            const $ = cheerio.load(response.data);

            // Get Pages...
            $('.rc-pagination').children().each( (i,e) =>
            {
                page = parseInt( $(e).text() );
                if( !isNaN(page) ) Thesaurus_PAGES = page;
                //$log(`Pagination TExt::${PAGES}`);
            });

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
                // else
                // {
                //     $log("--->> No Antonyms found! <<<---");
                // }

            });

            // --- GET EXAMPLE WORD USAGES ---
            let examples_section = $('.collapsible-content').html();
            LEX_Parse_Examples(examples_section);

            resolve('Thesaurus scraped!');

        }).catch( (error) =>
        {

        });

    });
}

/**
 * MACMILLAN DICTIONARY PARSING METHODS --------------------------------------->>>>>>>>>>
 */
async function MMD_Parse_Word_Forms(_wordForms) {
    return new Promise((resolve, reject) => {

        $log(`Running function::MMD_Parse_Word_Forms >>>>>`);

        //-Build URL
        let MacMillan_URL = macmillian_URL + wordURL;

        //-Make the request...
        axios.get( MacMillan_URL ).then((response) => 
        {
            //-Load via Cheerio
            let $ = cheerio.load(response.data);

            $log('__________________MACMILLAN DICTIONARY_________________________');

            //-Temp array
            let _WordForms = [];

            //-Iterate through the table 
            $('tr').each((i, e) => 
            {
                let row_HTML = $(e).html()
                let $$ = cheerio.load(row_HTML);
                //
                let inflectionType = $$('.INFLECTION-TYPE').text();
                if (DEBUG.Word_Forms) $log(`Inflection Type ${i}::${inflectionType}`);

                let form = $$('.INFLECTION-CONTENT').text();
                if (DEBUG.Word_Forms) $log(`Inflection Form ${i}::${form}`);

                let pronunciation = $('.PRON').text();
                if( DEBUG.Pronunation ) $log(`Pronunciation ${i}::${pronunciation}`);

                let wordClass = $('.PART-OF-SPEECH').text().split(' ')[0];
                if( DEBUG.Word_Class )$log(`Word Class ${i}::${wordClass}`);

                //+++Add word form to the WORD object
                if (form != '') {
                if (inflectionType != '' || form != '') 
                {
                    let _wordForm = new WordClass.Derived_Word_Forms();
                    _wordForm.Form = form;
                    _wordForm.Inflection_Type = inflectionType;
                    _wordForm.Pronunciation   = pronunciation;
                    _wordForm.Word_Class      = wordClass;
                    //-Add to forms to temp-list
                    _WordForms.push(_wordForm);
                }}
            });

            //-Add the new/basic forms to the 'fore of the Forms array

            //$log("Word Forms-->")
            //console.table( WORD_FORMS );

            //++Add to the Global Word object
            for(let i=0; i<_WordForms.length; i++)
            {
                WORD.Forms.push( _WordForms[i] );
            }

            resolve();
            
        });

    });
}

/**
 * Get the pronunciation of the current KeyWord from the McMillan dictionary
 * @param {string} _word The word we're working with
 */
async function ADL_Get_Pronunciation(_word) {
    return new Promise((resolve, reject) => {

        $log(`Running function::ADL_Get_Pronunciation >>>>>`);

        //-Parse word
        let word = _word || wordURL;

        //-Build URL
        let MacMillan_URL = macmillian_URL + word;

        //-Make the request...
        axios.get( MacMillan_URL ).then((response) => 
        {
            const $ = cheerio.load(response.data);

            let pronunciation = $('.PRON').text();
            if( DEBUG.Pronunation ) $log(`Pronunciaton::${pronunciation}`);

            resolve(pronunciation);
        });
    });
}

/**
 * Scrape pronunciation from Google
 * @param {string} _word The word we're using
 */
async function ADL_Get_SyllabicForm (_word='') {
    return new Promise((resolve, reject) => {

        $log(`Running function::ADL_Get_SyllabicForm >>>>>`);

        //-Get active word
        if( _word=='' ) _word = wordURL;

        //-Set the URL
        let Syllables_URL = syllables_URL + _word; // definitions.net

        //-Make the request...
        axios.get( Syllables_URL ).then( (response) => 
        {
            // DEBUG
            $log(`Response::${response.status} | Response URL:: ${Syllables_URL}`);

            //-Cheerio the data
            const $ = cheerio.load(response.data);

            //-Pull syllabic form
            let _syllabicForm = $('.hyphenator').text();
            if( DEBUG.Syllables ) $log(`Syllabic Form:${_syllabicForm}`);

            resolve( _syllabicForm );
            return;
        });//|AXIOS END
    });
}

/**
 * Get related words, and the syononyms for each related word!
 * @param {string} _word 
 */
async function ADL_GetRelatedWords_Synonyms (_word='') {
    return new Promise((resolve, reject) => 
    {
        //-Set the URL
        let Thesaurus_URL = thesaurus_URL + wordURL;

        $log("____________________Scraping Thesaurus for Related Words/Synonyms___________________");

        //-Loop through each page of related words + synonyms
        for (let i = 1; i <= Thesaurus_PAGES; i++) 
        {
            //-Set the page URL
            let Thesaurus_URL_page = Thesaurus_URL + '/' + i.toString();
            //-Run the request
            axios.get(Thesaurus_URL_page).then((response) => 
            {
                // DEBUG
                $log(`Response::${response.status} | Response URL:: ${Thesaurus_URL}`);

                //-Cheerio the data
                const $ = cheerio.load(response.data);

                $log(`Pagination Pages::${Thesaurus_PAGES}`);

                //-Get Related-Word sections ...CSS class = .e1x7e0fw0
                $('.e1x7e0fw0').each( (i,e) =>
                {
                    let $$ = cheerio.load(e);

                    let _relatedWord_Synonyms = new WordClass.Related_Word_Synonyms();

                    //-Get Related Word
                    let _relatedWord = $$('h3').text();
                    _relatedWord_Synonyms.Related_Word = _relatedWord;
                    $log(`Related Word Section title::${_relatedWord}`);

                    //-Get Synonyms
                    $$('li').each((i,e) =>
                    {
                        let _synonym = $$(e).text();
                        _relatedWord_Synonyms.push( _synonym );
                        $log(`Synonym::${_synonym}`);
                    });

                    //+++Add to Global Object
                    WORD.RelatedWord_Synonyms.push( _relatedWord_Synonyms );
                });

                //-Resolve scrape
                if( i==PAGES ) resolve();
            });
        }

    });
}

/**
 * Break a word into its syllabals! - WORK IN PROGRESS - ADL_GET_Phonetics() does a better job!
 * @param {string} _word The Word to Syllabify
 */
async function ADL_Get_Syllables (_word='') {
    return new Promise((resolve, reject) => {

        _word = 'Ham Fisted';

        // DEBUG
        $log(`Get syllables for::${_word}`);

        //-Get active word
        let word = _word.toLowerCase() || wordURL.toLowerCase;

        //***Format word (incase it's a phrase) */
        let words = [ word ];
        if( word.includes(' ') ) words = word.split(' ');
        if( word.includes('-') ) words = word.split('-');

        let loops = words.length;

        for(let i=0; i < loops; i++)
        {
            // DEBUG
            $log(`Syllabalising this word part::${words[i]}`);

            //-Set the URL
            let Syllables_URL = (syllables_URL + words[i]);

            //-Make the request...
            axios.get( Syllables_URL ).then( (response) => 
            {
                // DEBUG
                $log(`Response::${response.status} | Response URL:: ${Syllables_URL}`);

                //-Cheerio the data
                const $ = cheerio.load(response.data);

                //-Pull pronunciation/hyphenation
                let syllable = $('#SyllableContentContainer').text();
                $log(`Syllable :: ${syllable}`)
                //let _pronunciation = $('.hyphenator').text();
                //resolve(_pronunciation);


            });//|AXIOS END

            resolve('Cracked all syllabals')

        }



        //#region Syllable algo...
        // // Regex
        // const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
        // //-Format the word in question
        // let word = _word.toLowerCase();
        // let syllabified = word.match(syllableRegex);
        // $log(`Syllabified word::${syllabified}`);
        //#endregion

    });
}


/**
 * DICTIONARY.COM PARSING METHODS --------------------------------------------->>>>>>>>>>
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

    $log('________________________DEFINITIONS HTML_________________________');
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
            if( DEBUG.Definitions ) $log(`!!Word Class found::${wordClassFound}`);
            //wordClassFound=true; //<--testing
        if( wordClassFound==true )
        {
            // Definition collection's word class/gramatical category
            let definition_wordClass = defintion('.luna-pos').text().replace(',', '');
            if( DEBUG.Definitions ) $log(`->Word Class::${definition_wordClass}` );

            let grammatical_category = defintion('.luna-grammatical-category').text();
            if( DEBUG.Definitions ) $log(`->Grammatical Category::${grammatical_category}` );

            let inflected_forms = [];
            defintion('.luna-inflected-form').each( (i,e) =>
            {
                let _if = $(e).text().replace(/·/g, '-');
                inflected_forms.push( _if );
            });
            if( DEBUG.Definitions ) $log(`->Inflected Form/s::${ inflected_forms }` );
            
            let inflected_pron = [];
            defintion('.pron-spell').each( (i,e) =>
            {
                let _if_p = $(e).text();
                inflected_pron.push( _if_p );
            });
            if( DEBUG.Definitions ) $log(`->Inflected Pronunciation/s::${inflected_pron}` );

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
                        if( DEBUG.Definitions ) $log(`->Context ${defNo}::${contextual_Definition}`)
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
                                if( DEBUG.Definitions ) $log(`->Contextual Subdefinition ${defNo}::${d}`);
                                if( DEBUG.Definitions ) $log(`->Contextual Subdefinition Example ${defNo}::${_example}`);
                            });
                        }

                        //-Singular definition
                        if( multipleDefinitions==null ) 
                        {
                            definition = $(e).text().split('.')[1];
                            if( DEBUG.Definitions ) $log(`->Contextual definition ${defNo}::${definition}`);
                            //-Check for example
                            example = def('.luna-example').text();
                            if( example!='' )
                                if( DEBUG.Definitions ) $log(`->Contextual definition example ${defNo}::${example}`);     
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

                            if( DEBUG.Definitions ) $log(`Example-Def ${defNo}::${definition}`)
                            if( DEBUG.Definitions ) $log(`Example ${defNo}::${example}`)
                        }
                    }

                    //-Regular definition
                    if( DEBUG.Definitions ) $log(`>>Definition ${defNo}::${ definition }` );

                    // +Assign to Global Object ////////////////////////////////////////
                    DEFINITION.Context = contextual_Definition;
                    DEFINITION.Definitions = DEFINITION.Definitions.concat( definition );
                    DEFINITION.Examples = DEFINITION.Examples.concat( example );

                    // Push this definition to the block ////
                    DEF_BLOCK.Definitions.push( DEFINITION );
                }
            });

            // DEBUG
            if( DEBUG.Definitions ) $log(`\nSection Index::${i}`);

            // +Add Definition to global WORD obj. //
            WORD.Definition_Blocks.push( DEF_BLOCK );

            if( DEBUG.Definitions ) console.table( WORD.Definition_Blocks )
        }

    }//|END - Check if we've found a 'word-class' e.g. noun!
    });

}

/**
 * Parse the pronunciation for the word!
 * This comes from Dictionary.com
 */
function LEX_Parse_Pronunciation (_headword) {
    return new Promise((resolve, reject) => {

        let $ = cheerio.load( _headword );

        let pronunciation = $('.pron-spell-content').text();
        if( DEBUG.Definition ) $log(`>>Pronunciation::${ pronunciation }` );

        //+ Add Pronunciation /////////////
        WORD.Pronunciation = pronunciation;

    });
}


function LEX_Parse_Derivations ( _otherForms )
{
    //-Load via Cheerio
    let $ = cheerio.load( _otherForms );

    let derivationClass = 'css-1urpfgu'; //<--Unnecessary so far...

    $('h2').each( (i,e) =>
    {
        //-Format header for consistency
        let header = $(e).text().toLowerCase().trim();
        //-Check for derived form sections...
        if( header.startsWith("other words from") 
        ||  header.startsWith("derived forms") )
        {
            let parent_E = $(e).parent().html();
            let $$ = cheerio.load( parent_E );

            $$('span').each( (i,e) =>
            {
                let _form = $$(e).text();
                if( _form.includes(',') )
                {
                    let word_form = _form.split(',');

                    //+++Create Word Form Object //////////////////////
                    let WORD_FORMS = new WordClass.Derived_Word_Forms();
                    WORD_FORMS.Form = word_form[0].replace(/·/g, '');
                    WORD_FORMS.Word_Class = word_form[1].trim();
                    WORD_FORMS.Pronunciation = word_form[0];
                    //
                    WORD.Forms.push( WORD_FORMS );
                    //
                    if( DEBUG.Word_Forms) $log( `Word Form ${x}::${word_form[x]}` );
                }
                
            });

        }

    });

    // DEBUG
    if( DEBUG.Word_Forms) console.table( WORD.Forms )
}

/**
 * Pull example sentances/usages of the word in question.
 * @param {Object} _exampleSection HTML Object containing examples
 */
function LEX_Parse_Dictionary_Examples( _exampleSection )
{
    //-Cheerio the html parameter
    let $ = cheerio.load( _exampleSection );
    $log('___EXAMPLES DICTIONARY HTML___');

    $('p').each( (i,e) =>
    {
        let example = $(e).text();
        if( DEBUG.Def_Examples ) $log(`Example::${example}`);
        //
        let attribution = $(e).next().text();
        if( DEBUG.Def_Examples ) $log(`Example:: -- ${attribution}`);

        //+ Add EXAMPLE //////////////////////
        let EXAMPLE = new WordClass.Example();
        EXAMPLE.Example = example;
        EXAMPLE.Attribution = attribution;
        //
        WORD.Examples.push( EXAMPLE );
    });
}


/**
 * THESAURUS.COM PARSING METHODS ----------------------------------------------->>>>>>>>>>>
 */

/**
 * Pull example sentances/usages of the word in question.
 * @param {Object} _exampleSection HTML Object containing examples
 */
function LEX_Parse_Examples(_exampleSection) {
    //return new Promise((resolve, reject) => {

        //-Cheerio the html parameter
        let $ = cheerio.load(_exampleSection);
        $log('___EXAMPLES HTML___');

        $('p').each((i, e) => {
            let example = $(e).text();
            if (DEBUG.Syn_Examples) $log(`Example::${example}`);

            //+ Add EXAMPLE //////////////////////
            let EXAMPLE = new WordClass.Example();
            EXAMPLE.Example = example;
            //
            WORD.Examples.push(EXAMPLE);
        });

        $log("Examples pulled!");
        //resolve();
    //});
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

        // ADD TO GLOBAL WORD OBJ ////////
        let ANTONYM = new WordClass.Antonym();
        ANTONYM.Antonym   = antonym;
        ANTONYM.Relevance = relevance;
        //
        WORD.Antonyms.push( ANTONYM );

        if( DEBUG.Antonyms ) $log(`Antonym::${antonym} - Relevance::${relevance}`);
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

        // ADD TO GLOBAL WORD OBJ ////////////
        let SYNONYM = new WordClass.Synonym();
        SYNONYM.Synonym   = synonym;
        SYNONYM.Relevance = relevance;
        //
        WORD.Synonyms.push( SYNONYM );

        if( DEBUG.Synonyms ) $log(`Synonym::${synonym} - Relevance::${relevance}`);
    });

}



