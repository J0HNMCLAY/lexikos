

/**
 * The all-important word class!
 */
exports.Word = class {
    constructor () 
    {
        this.Word='';
        this.Pronunciation='';
        this.Definitions = [];
    }
}

exports.Definition = class {
    constructor()
    {
        this.Word_Class='';
        this.Grammatical_Category='';
        this.Inflected_Forms = [];
        this.Definition = [];
    }
}

exports.Inflected_Form = class {
    constructor ()
    {
        this.Form = '';
        this.Pronunciation = '';
    }
}