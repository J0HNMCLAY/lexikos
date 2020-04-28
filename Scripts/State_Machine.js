

exports.State_Machine = class 
{
    constructor ()
    {
        this.State = '';
        this.Loop  = 0;
    }
    Is = (_state) => 
    { 
        if(this.State==_state) return true; return false; 
    }
    Set = (_state) => 
    { 
        this.State = _state; 
    }
    
}