

/**
 * The all-important word class!
 */
exports.Word = class {
    constructor () 
    {
        this.Word='';
        this.Pronunciation='';
        this.Definitions = [];
        this.Etymology;
        this.Synonyms;
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

exports.Word_Class = class {
    constructor()
    {
        this.Word_Class='';
        this.Grammatical_Category='';
        this.Inflected_Forms = [];
        this.Definition = [];
    }
}

exports.Definition = class {
    constructor () 
    {
        this.Context     = "";
        this.Definitions = [];
        this.Example     = [];
    }
}

exports.Inflected_Form = class {
    constructor ()
    {
        this.Form = '';
        this.Pronunciation = '';
    }
}

exports.Etymology = class {
    constructor ()
    {
        this.Origin = ''; 
        this.Origin_Period = '';
    }
}

exports.Synonyms = class {
    constructor ()
    {
        this.BriefList = [];
        this.Comprehensive = [];
    }
}