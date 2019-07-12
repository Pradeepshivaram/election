pragma solidity >=0.4.21 <0.6.0;

contract Election {
    // model of canditate
    struct Canditate {
        uint id;
        string name;
        uint voteCount;
    }

    // Store accounts that have voted
    mapping( uint => Canditate)  public  candidates;

    // Store Candidates
    // Fetch Candidate
    mapping (address => bool) public voters;

    // Store Candidates Count
    uint public candidateCount;

    event voted(uint _candidateId); // event

    constructor() public {
        addCandidate("pradeep");
        addCandidate("sandeep");
        addCandidate("sanjay");
        addCandidate("sagar");
    }

    function addCandidate(string memory _name) private {
        candidateCount++;
        candidates[candidateCount] = Canditate(candidateCount, _name, 0);
    }

    function vote(uint _candidateId) public {

        // require that they haven't voted before
        require(!voters[msg.sender], "You have already voted");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate");

        // record that voter has voted
        voters[msg.sender] = true;

        candidates[_candidateId].voteCount++;

        emit voted(_candidateId); // triggering event
    }


}