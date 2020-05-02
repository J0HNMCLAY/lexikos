

/**
 * The all-important word class!
 */
exports.Word = class {
    constructor () 
    {
        this.Word='';
        this.Pronunciation='';
        this.Definition_Blocks = [];
        //
        this.Synonyms  = [];
        this.Antonyms  = [];
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

exports.Definition_Block = class {
    constructor () 
    {
        this.Grammatical_Category = "";
        this.Inflected_Forms = [];
        //
        this.Definitions = [];
    }
}

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
 * Synonyms for the word
 */
exports.Synonym = class {
    constructor ()
    {
        this.Synonym   = "";
        this.Relevance = 0;
    }
}

exports.Etymology = class {
    constructor ()
    {
        this.Origin = ''; 
        this.Origin_Period = '';
    }
}

