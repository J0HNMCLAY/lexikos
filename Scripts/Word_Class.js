

/**
 * The all-important word class!
 */
exports.Word = class {
    constructor () 
    {
        this.Word='';
        this.Pronunciation='';
        this.Forms = [];
        this.Definition_Blocks = [];
        //
        this.Synonyms  = [];
        this.Antonyms  = [];
        //
        this.Examples  = [];
        this.Etymology = '';
        //
        this.Off=false; //<-- DEBUG Use!
    }
    /**
     * Returns a formatted instance of the word!
     * e.g. lexicon --> returns Lexicon
     */
    Capitalised = function () {
        let word = this.Word.replace(/^\w/, c => c.toUpperCase());
        return word;
    }
}

/**
 * Defintion block - e.g. as definied by it's grammatical category!
 */
exports.Definition_Block = class {
    constructor () 
    {
        this.Grammatical_Category = "";
        this.Inflected_Forms = [];
        //
        this.Definitions = [];
    }
}

/**
 * Individual defintiion object
 */
exports.Definition = class {
    constructor()
    {
        this.Context     = "";
        this.Definitions = [];
        this.Examples    = [];
    }
}

/**
 * Inflected forms are: Plurals, etc.
 */
exports.Inflected_Form = class 
{
    constructor ()
    {
        this.Grammatical_Category = '';
        this.Form = '';
        this.Pronunciation = '';
    }
}

/**
 * Derived forms of the base word
 */
exports.Derived_Word_Forms = class {
    constructor () {
        this.Form = '';
        this.Word_Class = '';
        this.Pronunciation = '';
        this.Inflection_Type = '';
    }
}

/**
 * Synonyms for the word
 */
exports.Synonym = class {
    constructor ()
    {
        this.Synonym   = "";
        this.Relevance = 0;
    }
}
/**
 * Antonyms for the word
 */
exports.Antonym = class {
    constructor ()
    {
        this.Antonym   = "";
        this.Relevance = 0;
    }
}
/**
 * Examples of the word
 */
exports.Example = class {
    constructor ()
    {
        this.Example     = "";
        this.Attribution = "";
    }
}

exports.Etymology = class {
    constructor ()
    {
        this.Origin = ''; 
        this.Origin_Period = '';
    }
}

/*
Word Forms::
-->Forms::rushingly
-->Forms::unrushed
-->Forms::rushlike
-->Forms::rusher
-->Forms::rushlike
-->Forms::rush
-->Forms::rushes
-->Forms::rushing
-->Forms::rushed
-->Forms::rushed
*/

