

exports.State_Machine = class 
{
    constructor ()
    {
        this.State = '';
        this.Loop  = 0;
        //
        this.Debug = false;
    }
    Is = (_state) => 
    { 
        if(this.State==_state) return true; return false; 
    }
    Set = (_state) => 
    { 
        this.State = _state; 
        // DEBUG
        console.log(`State-Machine. State updated to::${this.State}`);
    }
    Process = () => { this.State="PROCESSING"; }

}